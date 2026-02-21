import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Alert,
  Box,
  CircularProgress,
  Chip,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { api } from '@/utils/api';

interface CommandOption {
  name: string;
  description: string;
  accepts_value: boolean;
  default: string | boolean | null;
}

interface CommandArgument {
  name: string;
  description: string;
  required: boolean;
  default: string | null;
}

interface Command {
  name: string;
  description: string;
  arguments: CommandArgument[];
  options: CommandOption[];
  destructive: boolean;
}

interface RunResult {
  output: string;
  exit_code: number;
  duration_ms: number;
}

export const CommandRunnerPanel = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCommand, setExpandedCommand] = useState<string | null>(null);
  const [runningCommand, setRunningCommand] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, RunResult>>({});
  const [optionValues, setOptionValues] = useState<Record<string, Record<string, string | boolean>>>({});
  const [argValues, setArgValues] = useState<Record<string, Record<string, string>>>({});
  const [confirmCommand, setConfirmCommand] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchCommands();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchCommands = async () => {
    try {
      const data = await api.get<{ commands: Command[] }>('/admin/commands', { useCache: false });
      setCommands(data.commands);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Failed to load commands' });
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const hasInputs = (cmd: Command) => {
    return cmd.arguments.length > 0 || cmd.options.length > 0;
  };

  const toggleExpand = (name: string) => {
    setExpandedCommand(expandedCommand === name ? null : name);
  };

  const setOptionValue = (cmdName: string, optName: string, value: string | boolean) => {
    setOptionValues(prev => ({
      ...prev,
      [cmdName]: { ...prev[cmdName], [optName]: value },
    }));
  };

  const setArgValue = (cmdName: string, argName: string, value: string) => {
    setArgValues(prev => ({
      ...prev,
      [cmdName]: { ...prev[cmdName], [argName]: value },
    }));
  };

  const buildOptions = (cmd: Command): Record<string, string | boolean> => {
    const opts: Record<string, string | boolean> = {};
    const cmdOpts = optionValues[cmd.name] || {};
    const cmdArgs = argValues[cmd.name] || {};

    for (const arg of cmd.arguments) {
      const val = cmdArgs[arg.name];
      if (val !== undefined && val !== '') {
        opts[arg.name] = val;
      }
    }

    for (const opt of cmd.options) {
      const val = cmdOpts[opt.name];
      if (val === undefined) continue;
      if (opt.accepts_value) {
        if (val !== '' && val !== false) {
          opts[opt.name] = val as string;
        }
      } else {
        if (val === true) {
          opts[opt.name] = true;
        }
      }
    }

    return opts;
  };

  const executeCommand = async (cmdName: string) => {
    const cmd = commands.find(c => c.name === cmdName);
    if (!cmd) return;

    setRunningCommand(cmdName);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(prev => prev + 100), 100);

    try {
      const options = buildOptions(cmd);
      const result = await api.post<RunResult>('/admin/commands/run', {
        command: cmdName,
        options,
      });
      setResults(prev => ({ ...prev, [cmdName]: result }));
      if (result.exit_code === 0) {
        showMessage('success', `${cmdName} completed successfully`);
      } else {
        showMessage('error', `${cmdName} exited with code ${result.exit_code}`);
      }
    } catch (error: any) {
      showMessage('error', error?.message || `Failed to run ${cmdName}`);
    } finally {
      setRunningCommand(null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleRun = (cmd: Command) => {
    if (cmd.destructive) {
      setConfirmCommand(cmd.name);
    } else {
      executeCommand(cmd.name);
    }
  };

  const handleConfirm = () => {
    if (confirmCommand) {
      executeCommand(confirmCommand);
      setConfirmCommand(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ padding: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={24} />
        <Typography>Loading commands...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 2, maxWidth: 900 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#000' }}>
        Commands
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        This is a dangerous area. Commands run directly against the database and infrastructure.
        Exercise caution and use --dry-run where available before running destructive operations.
      </Alert>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Run custom artisan commands from the admin panel. Destructive commands require confirmation before execution.
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {commands.map(cmd => {
        const isExpanded = expandedCommand === cmd.name;
        const isRunning = runningCommand === cmd.name;
        const result = results[cmd.name];

        return (
          <Card key={cmd.name} sx={{ mb: 2 }}>
            <CardContent sx={{ pb: 1, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                  >
                    {cmd.name}
                  </Typography>
                  {cmd.destructive && (
                    <Chip label="destructive" color="error" size="small" />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {hasInputs(cmd) && (
                    <Button
                      size="small"
                      onClick={() => toggleExpand(cmd.name)}
                      endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                      Options
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    size="small"
                    color={cmd.destructive ? 'error' : 'primary'}
                    onClick={() => handleRun(cmd)}
                    disabled={isRunning || runningCommand !== null}
                    startIcon={isRunning ? <CircularProgress size={16} /> : <PlayArrowIcon />}
                  >
                    {isRunning ? `${(elapsed / 1000).toFixed(1)}s` : 'Run'}
                  </Button>
                </Box>
              </Box>

              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                {cmd.description}
              </Typography>

              {hasInputs(cmd) && (
                <Collapse in={isExpanded}>
                  <Box sx={{ mt: 2, pl: 1, borderLeft: '3px solid #e0e0e0', ml: 1 }}>
                    {cmd.arguments.map(arg => (
                      <Box key={arg.name} sx={{ mb: 1.5 }}>
                        <TextField
                          size="small"
                          label={`${arg.name}${arg.required ? ' *' : ''}`}
                          helperText={arg.description}
                          value={argValues[cmd.name]?.[arg.name] || ''}
                          onChange={e => setArgValue(cmd.name, arg.name, e.target.value)}
                          fullWidth
                        />
                      </Box>
                    ))}
                    {cmd.options.map(opt => (
                      <Box key={opt.name} sx={{ mb: 1 }}>
                        {opt.accepts_value ? (
                          <TextField
                            size="small"
                            label={opt.name}
                            helperText={opt.description}
                            value={(optionValues[cmd.name]?.[opt.name] as string) || ''}
                            onChange={e => setOptionValue(cmd.name, opt.name, e.target.value)}
                            fullWidth
                          />
                        ) : (
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={!!optionValues[cmd.name]?.[opt.name]}
                                onChange={e => setOptionValue(cmd.name, opt.name, e.target.checked)}
                                size="small"
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body2" component="span" sx={{ fontFamily: 'monospace' }}>
                                  {opt.name}
                                </Typography>
                                {opt.description && (
                                  <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                                    {opt.description}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        )}
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              )}

              {result && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      label={`Exit: ${result.exit_code}`}
                      color={result.exit_code === 0 ? 'success' : 'error'}
                      size="small"
                    />
                    <Typography variant="caption" color="textSecondary">
                      {result.duration_ms}ms
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: '#1e1e1e',
                      color: '#d4d4d4',
                      p: 2,
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: 13,
                      whiteSpace: 'pre-wrap',
                      maxHeight: 400,
                      overflow: 'auto',
                      lineHeight: 1.5,
                    }}
                  >
                    {result.output || '(no output)'}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={confirmCommand !== null} onClose={() => setConfirmCommand(null)}>
        <DialogTitle>Confirm Destructive Command</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to run <strong>{confirmCommand}</strong>. This command is marked as destructive
            and may modify or delete data. Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCommand(null)}>Cancel</Button>
          <Button onClick={handleConfirm} color="error" variant="contained">
            Run Command
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommandRunnerPanel;
