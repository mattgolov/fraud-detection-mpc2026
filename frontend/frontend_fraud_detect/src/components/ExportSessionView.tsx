import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
  Button,
  CircularProgress,
  Stack,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ApiHandler from '../services/ApiHandler';

interface ExportSessionViewProps {
  sessionId: string;
}

function parseMultipartCsv(content: string): {
  masterLedger: string;
  flaggedLedger: string;
  fraudCasesSummary: string;
} {
  const boundary = 'csv_export_boundary';
  const parts = content.split(`--${boundary}`);

  const result = {
    masterLedger: '',
    flaggedLedger: '',
    fraudCasesSummary: '',
  };

  parts.forEach((part) => {
    if (part.includes('filename="session_master_ledger.csv"')) {
      const match = part.match(/\n\n([\s\S]*?)$/);
      if (match) result.masterLedger = match[1].trim();
    } else if (part.includes('filename="session_flagged_ledger.csv"')) {
      const match = part.match(/\n\n([\s\S]*?)$/);
      if (match) result.flaggedLedger = match[1].trim();
    } else if (part.includes('filename="session_fraud_cases_summary.csv"')) {
      const match = part.match(/\n\n([\s\S]*?)$/);
      if (match) result.fraudCasesSummary = match[1].trim();
    }
  });

  return result;
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function ExportSessionView({ sessionId }: ExportSessionViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportData, setExportData] = useState<{
    masterLedger: string;
    flaggedLedger: string;
    fraudCasesSummary: string;
  } | null>(null);

  useEffect(() => {
    const fetchExport = async () => {
      setIsLoading(true);
      setError(null);

      const response = await ApiHandler.exportSession(sessionId);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        const parsed = parseMultipartCsv(response.data);
        setExportData(parsed);
      }

      setIsLoading(false);
    };

    fetchExport();
  }, [sessionId]);

  const handleDownloadMasterLedger = () => {
    if (exportData?.masterLedger) {
      downloadCsv('session_master_ledger.csv', exportData.masterLedger);
    }
  };

  const handleDownloadFlaggedLedger = () => {
    if (exportData?.flaggedLedger) {
      downloadCsv('session_flagged_ledger.csv', exportData.flaggedLedger);
    }
  };

  const handleDownloadFraudCasesSummary = () => {
    if (exportData?.fraudCasesSummary) {
      downloadCsv('session_fraud_cases_summary.csv', exportData.fraudCasesSummary);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#F8F9FA',
      }}
    >
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
          Export Session Data
        </Typography>
      </Paper>

      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography variant="body2" sx={{ color: '#C53030', mb: 3 }}>
            Error: {error}
          </Typography>
        )}

        {exportData && !isLoading && (
          <Stack spacing={3}>
            <Paper
              sx={{
                padding: '20px',
                backgroundColor: '#FFFFFF',
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
                Master Ledger
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  color: '#4A5568',
                  fontSize: '0.875rem',
                }}
              >
                All transactions in the session
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadMasterLedger}
                sx={{
                  backgroundColor: '#0066CC',
                  '&:hover': {
                    backgroundColor: '#0052A3',
                  },
                }}
              >
                Download Master Ledger
              </Button>
            </Paper>

            <Paper
              sx={{
                padding: '20px',
                backgroundColor: '#FFFFFF',
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
                Flagged Ledger
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  color: '#4A5568',
                  fontSize: '0.875rem',
                }}
              >
                Only flagged transactions linked to fraud cases
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadFlaggedLedger}
                sx={{
                  backgroundColor: '#0066CC',
                  '&:hover': {
                    backgroundColor: '#0052A3',
                  },
                }}
              >
                Download Flagged Ledger
              </Button>
            </Paper>

            <Paper
              sx={{
                padding: '20px',
                backgroundColor: '#FFFFFF',
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
                Fraud Cases Summary
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  color: '#4A5568',
                  fontSize: '0.875rem',
                }}
              >
                Summary of all fraud cases with their status and reviewer notes
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadFraudCasesSummary}
                sx={{
                  backgroundColor: '#0066CC',
                  '&:hover': {
                    backgroundColor: '#0052A3',
                  },
                }}
              >
                Download Fraud Cases Summary
              </Button>
            </Paper>
          </Stack>
        )}

        {!isLoading && !exportData && !error && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" sx={{ color: '#718096' }}>
              No data available for export
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}
