import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Container,
  Stack,
  CircularProgress,
  IconButton,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { FraudCase } from '../interface/FraudCase';
import ApiHandler from '../services/ApiHandler';

interface FraudCasesViewProps {
  sessionId: string;
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

export default function FraudCasesView({ sessionId }: FraudCasesViewProps) {
  const navigate = useNavigate();
  const [fraudCases, setFraudCases] = useState<FraudCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFraudCases = async () => {
      setIsLoading(true);
      setError(null);

      const response = await ApiHandler.getFraudCases(sessionId);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setFraudCases(response.data);
        const fraudCaseQueue = response.data.map((fc) => fc.id);
        sessionStorage.setItem('fraudCaseQueue', JSON.stringify(fraudCaseQueue));
      }

      setIsLoading(false);
    };

    fetchFraudCases();
  }, [sessionId]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F8F9FA',
      }}
    >
      {/* Header with Title and Loading Indicator */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: '#FFFFFF',
          padding: '24px 32px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h2" sx={{ fontSize: '1.75rem', fontWeight: 600 }}>
          Fraud Cases Queue
        </Typography>

        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} sx={{ color: '#718096' }} />
            <Typography
              variant="caption"
              sx={{ color: '#718096', fontSize: '0.75rem' }}
            >
              loading...
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        {error && (
          <Typography variant="body2" sx={{ color: '#C53030', mb: 3 }}>
            Error: {error}
          </Typography>
        )}

        <Stack spacing={2}>
          {/* @todo: For each fraude case include button with -> that when clicked naviages to  '/fraud_cases/:sessionId/:pk'*/}
          {fraudCases.map((fraudCase) => {
            const statusColor = getStatusColor(
              fraudCase.status,
              fraudCase.risk_score
            );

            return (
              <Paper
                key={fraudCase.id}
                sx={{
                  padding: '16px 20px',
                  borderLeft: `4px solid ${statusColor.color}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  },
                }}
              >
                {/* Left Section: Case ID and Typology */}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: '#172B4D',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                      }}
                    >
                      {fraudCase.id}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#4A5568',
                        fontSize: '0.875rem',
                      }}
                    >
                      {new Date(fraudCase.timestamp).toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      color: '#172B4D',
                    }}
                  >
                    {fraudCase.fraud_typology}
                  </Typography>
                </Box>

                {/* Middle Section: Risk Score */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mx: 3,
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: statusColor.color,
                      fontSize: '1.5rem',
                    }}
                  >
                    {fraudCase.risk_score}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#718096',
                      fontSize: '0.7rem',
                    }}
                  >
                    RISK SCORE
                  </Typography>
                </Box>

                {/* Right Section: Status Chip and Navigation */}
                <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={fraudCase.status}
                    sx={{
                      backgroundColor: statusColor.backgroundColor,
                      color: statusColor.color,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      height: '28px',
                      '& .MuiChip-label': {
                        px: 1.5,
                      },
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() =>
                      navigate(`/fraud_cases/${sessionId}/${fraudCase.id}`)
                    }
                    sx={{
                      color: '#718096',
                      '&:hover': {
                        backgroundColor: 'rgba(113, 128, 150, 0.1)',
                        color: '#172B4D',
                      },
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Box>
              </Paper>
            );
          })}
        </Stack>

        {!isLoading && fraudCases.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              No fraud cases found for this session
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
