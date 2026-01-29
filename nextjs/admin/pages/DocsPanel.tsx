import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
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
  Collapse,
  Modal,
  IconButton,
  Slider,
  Tooltip,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { api } from '@/utils/api';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
});

// Dynamic import for ESM compatibility
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });

// Mermaid diagram component with fullscreen and zoom
const MermaidDiagram: React.FC<{ chart: string }> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const renderChart = async () => {
      if (!chart) return;

      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
        setError(null);
      } catch (err: any) {
        console.error('Mermaid rendering error:', err);
        setError(err.message || 'Failed to render diagram');
      }
    };

    renderChart();
  }, [chart]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleResetZoom = () => setZoom(100);

  if (error) {
    return (
      <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1, mb: 2 }}>
        <Typography color="error.contrastText" variant="body2">
          Diagram error: {error}
        </Typography>
        <pre style={{ fontSize: '0.8rem', marginTop: 8, overflow: 'auto' }}>{chart}</pre>
      </Box>
    );
  }

  const diagramContent = (
    <Box
      sx={{
        transform: `scale(${zoom / 100})`,
        transformOrigin: 'top left',
        transition: 'transform 0.2s ease',
        '& svg': {
          maxWidth: 'none',
          height: 'auto',
        },
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );

  return (
    <>
      {/* Inline preview */}
      <Box
        ref={containerRef}
        sx={{
          my: 3,
          p: 2,
          bgcolor: 'grey.50',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.200',
          position: 'relative',
        }}
      >
        <Tooltip title="View fullscreen">
          <IconButton
            onClick={() => setIsFullscreen(true)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'white',
              boxShadow: 1,
              '&:hover': { bgcolor: 'grey.100' },
            }}
            size="small"
          >
            <FullscreenIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ overflow: 'auto', maxHeight: 500 }}>
          <Box
            sx={{
              '& svg': {
                maxWidth: '100%',
                height: 'auto',
              },
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
          Click the expand icon for a larger, zoomable view
        </Typography>
      </Box>

      {/* Fullscreen modal */}
      <Modal
        open={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box
          sx={{
            width: '95vw',
            height: '95vh',
            bgcolor: 'white',
            borderRadius: 2,
            boxShadow: 24,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Toolbar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'grey.50',
            }}
          >
            <Typography variant="subtitle1" fontWeight={500}>
              Flow Diagram
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Zoom out">
                <IconButton onClick={handleZoomOut} size="small" disabled={zoom <= 25}>
                  <ZoomOutIcon />
                </IconButton>
              </Tooltip>
              <Slider
                value={zoom}
                onChange={(_, value) => setZoom(value as number)}
                min={25}
                max={300}
                step={5}
                sx={{ width: 150 }}
                size="small"
              />
              <Tooltip title="Zoom in">
                <IconButton onClick={handleZoomIn} size="small" disabled={zoom >= 300}>
                  <ZoomInIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'center' }}>
                {zoom}%
              </Typography>
              <Tooltip title="Reset zoom">
                <IconButton onClick={handleResetZoom} size="small">
                  <RestartAltIcon />
                </IconButton>
              </Tooltip>
              <Box sx={{ width: 16 }} />
              <Tooltip title="Close">
                <IconButton onClick={() => setIsFullscreen(false)} size="small">
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Diagram area */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 3,
              bgcolor: 'grey.100',
              display: 'flex',
              justifyContent: zoom <= 100 ? 'center' : 'flex-start',
              alignItems: zoom <= 100 ? 'flex-start' : 'flex-start',
            }}
          >
            {diagramContent}
          </Box>
        </Box>
      </Modal>
    </>
  );
};

interface DocFile {
  id: string;
  filename: string;
  title: string;
  size: number;
  modified: number;
}

interface DocFolder {
  name: string;
  title: string;
  files: DocFile[];
}

interface DocContent extends DocFile {
  content: string;
}

const DocsPanel: React.FC = () => {
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
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
      const data = await api.get<{ files: DocFile[]; folders: DocFolder[] }>('/admin/docs');
      setDocs(data.files || []);
      setFolders(data.folders || []);
      // Auto-expand all folders by default
      const expanded: Record<string, boolean> = {};
      (data.folders || []).forEach(f => { expanded[f.name] = true; });
      setExpandedFolders(expanded);
    } catch (err: any) {
      setError(err.message || 'Failed to load documentation');
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  const fetchDocContent = async (docId: string) => {
    try {
      setLoadingContent(true);
      const data = await api.get<DocContent>(`/admin/docs/${docId}`);
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
              {/* Root level files */}
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

              {/* Folders */}
              {folders.map((folder) => (
                <React.Fragment key={folder.name}>
                  <ListItemButton onClick={() => toggleFolder(folder.name)} sx={{ pl: 3 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {expandedFolders[folder.name] ? (
                        <FolderOpenIcon fontSize="small" color="primary" />
                      ) : (
                        <FolderIcon fontSize="small" color="primary" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={folder.title}
                      primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
                    />
                    {expandedFolders[folder.name] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                  <Collapse in={expandedFolders[folder.name]} timeout="auto" unmountOnExit>
                    <List dense disablePadding>
                      {folder.files.map((doc) => (
                        <ListItemButton
                          key={doc.id}
                          selected={selectedDoc?.id === doc.id}
                          onClick={() => fetchDocContent(doc.id)}
                          sx={{ pl: 6 }}
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
                    </List>
                  </Collapse>
                </React.Fragment>
              ))}

              {docs.length === 0 && folders.length === 0 && (
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
                  <ReactMarkdown
                    components={{
                      code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const codeContent = String(children).replace(/\n$/, '');

                        // Render mermaid diagrams
                        if (language === 'mermaid') {
                          return <MermaidDiagram chart={codeContent} />;
                        }

                        // For inline code (no language specified and no newlines)
                        if (!className && !codeContent.includes('\n')) {
                          return <code {...props}>{children}</code>;
                        }

                        // For code blocks
                        return (
                          <pre>
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        );
                      },
                      pre({ children }) {
                        // If the child is already a mermaid diagram, don't wrap it
                        if (React.isValidElement(children) && (children as any).type === MermaidDiagram) {
                          return <>{children}</>;
                        }
                        return <>{children}</>;
                      },
                    }}
                  >
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
