import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Box,
  Divider,
  CircularProgress,
} from '@mui/material';
import { api } from '@/utils/api';

const MODELS = [
  { id: 'Artist', name: 'Artist' },
  { id: 'Tattoo', name: 'Tattoo' },
];

export const ElasticPanel = () => {
  const [model, setModel] = useState('Artist');
  const [ids, setIds] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleRebuildByIds = async (bypass: boolean) => {
    if (!ids.trim()) {
      showMessage('error', 'Please enter at least one ID');
      return;
    }

    const idArray = ids.split(',').map(id => id.trim()).filter(id => id);

    if (bypass && idArray.length > 200) {
      showMessage('error', 'Bypass mode limited to 200 IDs. Use queued rebuild for larger batches.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = bypass ? '/admin/elastic/rebuild-bypass' : '/admin/elastic/rebuild';
      await api.post(endpoint, {
        model,
        ids: idArray,
      });
      showMessage('success', bypass ? 'Rebuild completed immediately' : 'Rebuild queued successfully');
      setIds('');
    } catch (error: any) {
      showMessage('error', error?.message || 'Failed to trigger rebuild');
    } finally {
      setLoading(false);
    }
  };

  const handleFullReindex = async () => {
    if (!confirm(`Are you sure you want to reindex ALL ${model} records? This may take a while.`)) {
      return;
    }

    setLoading(true);
    try {
      // Use scout:import via the reindex endpoint
      await api.post('/elastic/reindex', {
        model,
      });
      showMessage('success', `Full reindex started for ${model}`);
    } catch (error: any) {
      showMessage('error', error?.message || 'Failed to trigger full reindex');
    } finally {
      setLoading(false);
    }
  };

  const handleMigrateAlias = async () => {
    const alias = model.toLowerCase();
    if (!confirm(`Are you sure you want to migrate the alias for ${alias}?`)) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/elastic/migrate', { alias });
      showMessage('success', `Alias migration queued for ${alias}`);
    } catch (error: any) {
      showMessage('error', error?.message || 'Failed to migrate alias');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: 2, maxWidth: 800 }}>
      <Typography variant="h4" gutterBottom>
        Elasticsearch Management
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Reindex by IDs
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Reindex specific records by their IDs. Use comma-separated values.
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Model</InputLabel>
            <Select
              value={model}
              label="Model"
              onChange={(e) => setModel(e.target.value)}
            >
              {MODELS.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="IDs (comma-separated)"
            placeholder="1, 2, 3, 4, 5"
            value={ids}
            onChange={(e) => setIds(e.target.value)}
            sx={{ mb: 2 }}
            multiline
            rows={2}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleRebuildByIds(false)}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Queue Rebuild'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => handleRebuildByIds(true)}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Immediate Rebuild (max 200)'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Full Reindex
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Reindex all records for the selected model. This will be queued and processed in batches.
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Model</InputLabel>
            <Select
              value={model}
              label="Model"
              onChange={(e) => setModel(e.target.value)}
            >
              {MODELS.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="warning"
            onClick={handleFullReindex}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : `Reindex All ${model} Records`}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Alias Migration
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Migrate the Elasticsearch alias for the selected model.
          </Typography>

          <Button
            variant="outlined"
            color="info"
            onClick={handleMigrateAlias}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : `Migrate ${model.toLowerCase()} Alias`}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ElasticPanel;
