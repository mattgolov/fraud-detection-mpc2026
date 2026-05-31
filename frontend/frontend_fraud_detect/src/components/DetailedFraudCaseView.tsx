import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Container,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import type { FraudCase } from '../interface/FraudCase';
import type { Transaction } from '../interface/Transaction';
import ApiHandler from '../services/ApiHandler';

interface DetailedFraudCaseViewProps {
  sessionId: string;
  pk: string;
}

interface FraudCaseDetailResponse {
  fraud_case: FraudCase;
  flagged_cases: Transaction[];
  all_merchant_name: Transaction[];
  all_device_id: Transaction[];
  all_ip_address: Transaction[];
  all_card_id: Transaction[];
}

function getStatusColor(
  status: FraudCase['status'],
  riskScore: number
): { backgroundColor: string; color: string } {
  if (riskScore > 80 || status === 'REJECTED') {
    return {
      backgroundColor: '#FCE4EC',
      color: '#C53030',
    };
  }

  if (riskScore > 50 || status === 'ESCALATED') {
    return {
      backgroundColor: '#FFF3E0',
      color: '#C05621',
    };
  }

  return {
    backgroundColor: '#E8F5E9',
    color: '#22543D',
  };
}

function TransactionTable({
  transactions,
  title,
}: {
  transactions: Transaction[];
  title: string;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 600,
          color: '#172B4D',
          fontSize: '1rem',
        }}
      >
        {title} ({transactions.length})
      </Typography>
      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: '#FFFFFF',
          borderRadius: '4px',
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F8F9FA' }}>
              <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>
                Transaction ID
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>
                Timestamp
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>
                Amount
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>
                Merchant
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>
                Card
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>
                Device
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>
                IP Address
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#172B4D' }}>
                Flagged
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.transaction_id}>
                <TableCell sx={{ fontSize: '0.875rem', color: '#4A5568' }}>
                  {tx.transaction_id}
                </TableCell>
                <TableCell sx={{ fontSize: '0.875rem', color: '#4A5568' }}>
                  {new Date(tx.timestamp).toLocaleString()}
                </TableCell>
                <TableCell sx={{ fontSize: '0.875rem', color: '#4A5568' }}>
                  ${tx.amount.toFixed(2)}
                </TableCell>
                <TableCell sx={{ fontSize: '0.875rem', color: '#4A5568' }}>
                  {tx.merchant_name}
                </TableCell>
                <TableCell sx={{ fontSize: '0.875rem', color: '#4A5568' }}>
                  {tx.card_id}
                </TableCell>
                <TableCell sx={{ fontSize: '0.875rem', color: '#4A5568' }}>
                  {tx.device_id}
                </TableCell>
                <TableCell sx={{ fontSize: '0.875rem', color: '#4A5568' }}>
                  {tx.ip_address}
                </TableCell>
                <TableCell sx={{ fontSize: '0.875rem', color: '#4A5568' }}>
                  {tx.flagged_transaction ? (
                    <Chip
                      label="Flagged"
                      size="small"
                      sx={{
                        backgroundColor: '#FCE4EC',
                        color: '#C53030',
                        fontSize: '0.7rem',
                      }}
                    />
                  ) : (
                    <Typography variant="caption" sx={{ color: '#718096' }}>
                      —
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function DetailedFraudCaseView({
  sessionId,
  pk,
}: DetailedFraudCaseViewProps) {
  const navigate = useNavigate();
  const notesInputRef = useRef<HTMLInputElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);

  // State Management
  const [fraudCase, setFraudCase] = useState<FraudCase | null>(null);
  const [detailData, setDetailData] = useState<FraudCaseDetailResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLogsExpanded, setIsLogsExpanded] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [previousFraudCase, setPreviousFraudCase] = useState<FraudCase | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Data Fetching Effect
  useEffect(() => {
    const fetchFraudCase = async () => {
      setIsLoading(true);
      setError(null);

      const response = await ApiHandler.getFraudCase(sessionId, pk);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setFraudCase(response.data.fraud_case);
        setDetailData(response.data);
        setReviewerNotes(response.data.fraud_case.reviewer_notes);
      }

      setIsLoading(false);
    };

    fetchFraudCase();
  }, [sessionId, pk]);

  // Keyboard Listener Effect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isTypingInInput =
        document.activeElement === notesInputRef.current ||
        document.activeElement === filterInputRef.current;

      // Allow specific keys even when typing in input
      if (event.key === 'Escape') {
        notesInputRef.current?.blur();
        if (event.key === 'Escape') {
          // Could trigger export prompt or navigate back
          navigate(`/session/${sessionId}/export`);
        }
        return;
      }

      // Ignore global shortcuts if typing in notes
      if (isTypingInInput && event.key !== '/') {
        return;
      }

      const key = event.key.toLowerCase();

      switch (key) {
        case 'c':
          event.preventDefault();
          handleUpdateStatus('ACCEPTED');
          break;
        case 'e':
          event.preventDefault();
          handleUpdateStatus('ESCALATED');
          break;
        case 'x':
          event.preventDefault();
          handleUpdateStatus('REJECTED');
          break;
        case 'n':
          event.preventDefault();
          navigateToNextCase();
          break;
        case 'u':
          event.preventDefault();
          handleUndo();
          break;
        case 'l':
          event.preventDefault();
          setIsLogsExpanded(!isLogsExpanded);
          break;
        case '/':
          event.preventDefault();
          filterInputRef.current?.focus();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fraudCase, isLogsExpanded, sessionId, navigate]);

  // Handlers
  const handleUpdateStatus = async (newStatus: FraudCase['status']) => {
    if (!fraudCase) return;

    setPreviousFraudCase(fraudCase);
    setIsSaving(true);
    setSaveSuccess(false);

    const response = await ApiHandler.updateFraudCase(sessionId, pk, {
      status: newStatus,
      reviewer_notes: reviewerNotes,
    });

    if (response.error) {
      setError(response.error);
      setIsSaving(false);
    } else if (response.data) {
      setFraudCase(response.data);
      setSaveSuccess(true);
      setIsSaving(false);

      setTimeout(() => {
        navigateToNextCase();
      }, 1000);
    }
  };

  const handleNotesChange = (text: string) => {
    setReviewerNotes(text);
  };

  const navigateToNextCase = () => {
    const queue = sessionStorage.getItem('fraudCaseQueue');
    if (queue) {
      const queueArray: string[] = JSON.parse(queue);
      const currentIndex = queueArray.indexOf(pk);
      if (currentIndex >= 0 && currentIndex < queueArray.length - 1) {
        const nextId = queueArray[currentIndex + 1];
        navigate(`/fraud_cases/${sessionId}/${nextId}`);
      } else {
        navigate(`/fraud_cases/${sessionId}`);
      }
    }
  };

  const handleUndo = async () => {
    if (!previousFraudCase) return;

    setIsSaving(true);
    const response = await ApiHandler.updateFraudCase(
      sessionId,
      pk,
      {
        status: previousFraudCase.status,
        reviewer_notes: previousFraudCase.reviewer_notes,
      }
    );

    if (!response.error && response.data) {
      setFraudCase(response.data);
      setReviewerNotes(response.data.reviewer_notes);
      setPreviousFraudCase(null);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8F9FA',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !fraudCase || !detailData) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#F8F9FA',
          p: 3,
        }}
      >
        <Alert severity="error">
          {error || 'Failed to load fraud case'}
        </Alert>
      </Box>
    );
  }

  const statusColor = getStatusColor(fraudCase.status, fraudCase.risk_score);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F8F9FA',
      }}
    >
      {/* Header Block */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: '#FFFFFF',
          padding: '24px 32px',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontSize: '2rem',
                fontWeight: 700,
                color: statusColor.color,
                mb: 1,
              }}
            >
              {fraudCase.risk_score}
            </Typography>
            <Typography variant="caption" sx={{ color: '#718096' }}>
              RISK SCORE
            </Typography>
          </Box>
          <Chip
            label={fraudCase.status}
            sx={{
              backgroundColor: statusColor.backgroundColor,
              color: statusColor.color,
              fontWeight: 600,
            }}
          />
        </Box>

        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, color: '#172B4D' }}
          >
            {fraudCase.fraud_typology}
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, fontSize: '0.875rem', color: '#4A5568' }}>
            <Typography variant="body2">
              ID: {fraudCase.id}
            </Typography>
            <Typography variant="body2">
              {new Date(fraudCase.timestamp).toLocaleString()}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Case updated successfully. Moving to next case...
          </Alert>
        )}

        {/* Heuristic Reasons Board */}
        {typeof fraudCase.fraud_detection_engine_notes === 'object' &&
          fraudCase.fraud_detection_engine_notes !== null && (
            <Paper
              sx={{
                padding: '20px',
                backgroundColor: '#FFFFFF',
                mb: 3,
                borderLeft: `4px solid ${statusColor.color}`,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: '#172B4D',
                }}
              >
                Detection Reasoning
              </Typography>
              <Stack spacing={1}>
                {Object.entries(fraudCase.fraud_detection_engine_notes).map(
                  ([key, value]) => (
                    <Typography key={key} variant="body2" sx={{ color: '#4A5568' }}>
                      <strong>{key}:</strong> {String(value)}
                    </Typography>
                  )
                )}
              </Stack>
            </Paper>
          )}

        {/* Reviewer Action Field */}
        <Paper
          sx={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            mb: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              fontWeight: 600,
              color: '#172B4D',
            }}
          >
            Reviewer Notes & Actions
          </Typography>

          <Stack spacing={2}>
            <TextField
              inputRef={notesInputRef}
              multiline
              rows={4}
              value={reviewerNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Enter your notes and findings..."
              fullWidth
              disabled={isSaving}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.95rem',
                  lineHeight: '1.5em',
                },
              }}
            />

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => handleUpdateStatus('ACCEPTED')}
                disabled={isSaving}
                sx={{
                  backgroundColor: '#22543D',
                  '&:hover': { backgroundColor: '#1a3d2a' },
                  '&.Mui-disabled': { opacity: 0.5 },
                }}
              >
                [C] Confirm
              </Button>
              <Button
                variant="contained"
                onClick={() => handleUpdateStatus('ESCALATED')}
                disabled={isSaving}
                sx={{
                  backgroundColor: '#C05621',
                  '&:hover': { backgroundColor: '#a3461a' },
                  '&.Mui-disabled': { opacity: 0.5 },
                }}
              >
                [E] Escalate
              </Button>
              <Button
                variant="contained"
                onClick={() => handleUpdateStatus('REJECTED')}
                disabled={isSaving}
                sx={{
                  backgroundColor: '#C53030',
                  '&:hover': { backgroundColor: '#a91e1e' },
                  '&.Mui-disabled': { opacity: 0.5 },
                }}
              >
                [X] Reject
              </Button>
              {previousFraudCase && (
                <Button
                  variant="outlined"
                  onClick={handleUndo}
                  disabled={isSaving}
                  sx={{
                    borderColor: '#718096',
                    color: '#718096',
                    '&:hover': { backgroundColor: 'rgba(113, 128, 150, 0.1)' },
                  }}
                >
                  [U] Undo
                </Button>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, fontSize: '0.75rem', color: '#718096' }}>
              <Typography variant="caption">[N] Next case</Typography>
              <Typography variant="caption">[L] Toggle logs</Typography>
              <Typography variant="caption">[/] Filter</Typography>
              <Typography variant="caption">[Esc] Export & Exit</Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Aggregated Transaction Logs Section */}
        <Paper
          sx={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              mb: isLogsExpanded ? 3 : 0,
            }}
            onClick={() => setIsLogsExpanded(!isLogsExpanded)}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#172B4D',
              }}
            >
              Transaction Correlation Analysis
            </Typography>
            <IconButton size="small">
              {isLogsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={isLogsExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2 }}>
              <TextField
                inputRef={filterInputRef}
                size="small"
                placeholder="Filter transactions..."
                fullWidth
                sx={{ mb: 3 }}
              />

              {detailData.flagged_cases.length > 0 && (
                <TransactionTable
                  title="Flagged Cases"
                  transactions={detailData.flagged_cases}
                />
              )}

              {detailData.all_merchant_name.length > 0 && (
                <TransactionTable
                  title="Same Merchant Shared History"
                  transactions={detailData.all_merchant_name}
                />
              )}

              {detailData.all_device_id.length > 0 && (
                <TransactionTable
                  title="Same Device Shared History"
                  transactions={detailData.all_device_id}
                />
              )}

              {detailData.all_ip_address.length > 0 && (
                <TransactionTable
                  title="Same IP Shared History"
                  transactions={detailData.all_ip_address}
                />
              )}

              {detailData.all_card_id.length > 0 && (
                <TransactionTable
                  title="Same Card Shared History"
                  transactions={detailData.all_card_id}
                />
              )}
            </Box>
          </Collapse>
        </Paper>
      </Container>
    </Box>
  );
}
