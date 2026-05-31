import { createBrowserRouter, RouterProvider, useParams } from 'react-router-dom';
import { ThemeProvider, Box, Typography } from '@mui/material';
import theme from './theme';
import './App.css';
import SetupView from './components/SetupView';
import FraudCasesView from './components/FraudCasesView';
import DetailedFraudCaseView from './components/DetailedFraudCaseView';
import ExportSessionView from './components/ExportSessionView';

function FraudCasesViewWrapper() {
  const { sessionId } = useParams<{ sessionId: string }>();
  return <FraudCasesView sessionId={sessionId || ''} />;
}

function DetailedFraudCasesViewWrapper() {
  const { sessionId, pk } = useParams<{ sessionId: string; pk: string }>();
  return <DetailedFraudCaseView sessionId={sessionId || ''} pk={pk || ''} />;
}

function ExportSessionViewWrapper() {
  const { sessionId } = useParams<{ sessionId: string }>();
  return <ExportSessionView sessionId={sessionId || ''} />;
}

function NotFoundView() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        gap: 2,
      }}
    >
      <Typography variant="h1">404</Typography>
      <Typography variant="body1">Page not found</Typography>
    </Box>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <SetupView />,
  },
  {
    path: '/setup',
    element: <SetupView />,
  },
  {
    path: '/fraud_cases/:sessionId',
    element: <FraudCasesViewWrapper />,
  },
  {
    path: '/fraud_cases/:sessionId/:pk',
    element: <DetailedFraudCasesViewWrapper />, 
  },
  {
    path: '/session/:sessionId/export',
    element: <ExportSessionViewWrapper />,
  },
  {
    path: '*',
    element: <NotFoundView />,
  },
]);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
