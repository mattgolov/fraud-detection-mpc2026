import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Button,
  Fab,
  Typography,
  Container,
  Stack,
  TextField,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import ApiHandler from '../services/ApiHandler';

export default function SetupView() {
  const navigate = useNavigate();
  const [reviewerName, setReviewerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDebugMode = import.meta.env.VITE_DEBUG === 'true';

  const handleFileSelect = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);
    setIsLoading(true);

    try {
      if (isDebugMode) {
        const mockSessionId = `mock-session-${Date.now()}`;
        sessionStorage.setItem('sessionId', mockSessionId);
        sessionStorage.setItem('reviewerName', reviewerName || 'Anonymous Reviewer');
        setUploadSuccess(true);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setTimeout(() => {
          navigate(`/fraud_cases/${mockSessionId}`);
        }, 500);
      } else {
        const result = await ApiHandler.uploadCsv(file);
        if (result.error) {
          setUploadError(result.error);
        } else {
          setUploadSuccess(true);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          const sessionId = (result.data as { id?: string })?.id || 'unknown-session';
          sessionStorage.setItem('sessionId', sessionId);
          sessionStorage.setItem('reviewerName', reviewerName || 'Anonymous Reviewer');
          setTimeout(() => {
            navigate(`/fraud_cases/${sessionId}`);
          }, 500);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUploadError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = '#E2E8F0';
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = '#FFFFFF';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = '#FFFFFF';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFabClick = () => {
    fileInputRef.current?.click();
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
      {/* Banner Header */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: '#FFFFFF',
          padding: '32px 24px',
          borderBottom: '1px solid #E2E8F0',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 600 }}>
          Fraud Detection Portal
        </Typography>
      </Paper>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 8 }}>
        <Stack spacing={6} sx={{ alignItems: 'center' }}>
          {/* Reviewer Name Input */}
          <Paper
            sx={{
              width: '100%',
              maxWidth: '500px',
              padding: '24px 32px',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
            }}
          >
            <Stack spacing={2}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#172B4D' }}>
                Reviewer Information
              </Typography>
              <TextField
                label="Reviewer Name"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                fullWidth
                placeholder="Enter your name"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#F8F9FA',
                  },
                }}
              />
            </Stack>
          </Paper>

          {/* File Upload Box */}
          <Paper
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              width: '100%',
              maxWidth: '500px',
              padding: '64px 32px',
              textAlign: 'center',
              border: '2px dashed #CBD5E0',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#A0AEC0',
                backgroundColor: '#F8F9FA',
              },
            }}
          >
            <Stack spacing={3} sx={{ alignItems: 'center' }}>
              <CloudUploadIcon
                sx={{ fontSize: '56px', color: '#718096' }}
              />
              <Stack spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#172B4D' }}>
                  Upload CSV File
                </Typography>
                <Typography variant="body2" sx={{ color: '#718096' }}>
                  Drag and drop your CSV file here or click to select
                </Typography>
              </Stack>
              <Button
                variant="contained"
                onClick={handleFabClick}
                disabled={isLoading}
                sx={{
                  mt: 2,
                  backgroundColor: '#4A5568',
                  '&:hover': {
                    backgroundColor: '#2D3748',
                  },
                }}
              >
                {isLoading ? 'Uploading...' : 'Select File'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                hidden
                onChange={handleFileInputChange}
              />
            </Stack>
          </Paper>

          {/* Status Messages */}
          {uploadError && (
            <Typography variant="body2" sx={{ color: '#C53030' }}>
              Error: {uploadError}
            </Typography>
          )}
          {uploadSuccess && (
            <Typography variant="body2" sx={{ color: '#22543D' }}>
              File uploaded successfully!
            </Typography>
          )}
        </Stack>
      </Container>

      {/* Floating Action Button */}
      <Fab
        onClick={handleFabClick}
        sx={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          backgroundColor: '#4A5568',
          '&:hover': {
            backgroundColor: '#2D3748',
          },
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
