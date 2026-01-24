import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocFile {
  id: string;
  filename: string;
  title: string;
  size: number;
  modified: number;
}

interface DocContent extends DocFile {
  content: string;
}

const DocsPanel: React.FC = () => {
  const dataProvider = useDataProvider();
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/docs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documentation');
      }

      const data = await response.json();
      setDocs(data.files || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load documentation');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocContent = async (docId: string) => {
    try {
      setLoadingContent(true);
      const response = await fetch(`/api/admin/docs/${docId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch document content');
      }

      const data = await response.json();
      setSelectedDoc(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
    } finally {
      setLoadingContent(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Documentation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Internal documentation and guides for the InkedIn platform.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, minHeight: '70vh' }}>
        {/* Sidebar - Doc Tree */}
        <Card sx={{ width: 300, flexShrink: 0 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FolderIcon />
                <Typography variant="subtitle1" fontWeight="bold">
                  docs/
                </Typography>
              </Box>
            </Box>
            <List dense sx={{ py: 0 }}>
              {docs.map((doc) => (
                <ListItemButton
                  key={doc.id}
                  selected={selectedDoc?.id === doc.id}
                  onClick={() => fetchDocContent(doc.id)}
                  sx={{ pl: 3 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <DescriptionIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={doc.title}
                    secondary={`${formatSize(doc.size)}`}
                    primaryTypographyProps={{ fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.75rem' }}
                  />
                </ListItemButton>
              ))}
              {docs.length === 0 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No documentation files found
                  </Typography>
                </Box>
              )}
            </List>
          </CardContent>
        </Card>

        {/* Main Content - Doc Viewer */}
        <Card sx={{ flex: 1, overflow: 'hidden' }}>
          <CardContent sx={{ height: '100%', overflow: 'auto' }}>
            {loadingContent ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
              </Box>
            ) : selectedDoc ? (
              <Box>
                <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h5" gutterBottom>
                    {selectedDoc.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDoc.filename} &bull; {formatSize(selectedDoc.size)} &bull; Modified {formatDate(selectedDoc.modified)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    '& h1': { fontSize: '1.75rem', fontWeight: 600, mt: 3, mb: 2, borderBottom: '1px solid', borderColor: 'divider', pb: 1 },
                    '& h2': { fontSize: '1.5rem', fontWeight: 600, mt: 3, mb: 2 },
                    '& h3': { fontSize: '1.25rem', fontWeight: 600, mt: 2, mb: 1 },
                    '& h4': { fontSize: '1.1rem', fontWeight: 600, mt: 2, mb: 1 },
                    '& p': { mb: 2, lineHeight: 1.7 },
                    '& ul, & ol': { mb: 2, pl: 3 },
                    '& li': { mb: 0.5 },
                    '& code': {
                      bgcolor: 'grey.100',
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 0.5,
                      fontSize: '0.85rem',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    },
                    '& pre': {
                      bgcolor: 'grey.900',
                      color: 'grey.100',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      mb: 2,
                      '& code': {
                        bgcolor: 'transparent',
                        color: 'inherit',
                        p: 0,
                      },
                    },
                    '& table': {
                      width: '100%',
                      borderCollapse: 'collapse',
                      mb: 2,
                    },
                    '& th, & td': {
                      border: '1px solid',
                      borderColor: 'divider',
                      p: 1,
                      textAlign: 'left',
                    },
                    '& th': {
                      bgcolor: 'grey.100',
                      fontWeight: 600,
                    },
                    '& blockquote': {
                      borderLeft: '4px solid',
                      borderColor: 'primary.main',
                      pl: 2,
                      ml: 0,
                      my: 2,
                      color: 'text.secondary',
                      fontStyle: 'italic',
                    },
                    '& a': {
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    },
                    '& hr': {
                      border: 'none',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      my: 3,
                    },
                    '& img': {
                      maxWidth: '100%',
                      height: 'auto',
                    },
                  }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedDoc.content}
                  </ReactMarkdown>
                </Box>
              </Box>
            ) : (
              <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="300px"
                color="text.secondary"
              >
                <DescriptionIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6">Select a document</Typography>
                <Typography variant="body2">
                  Choose a document from the sidebar to view its contents
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DocsPanel;
