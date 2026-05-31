import { createBrowserRouter, RouterProvider, useParams } from 'react-router-dom';
import { ThemeProvider, Box, Typography } from '@mui/material';
import theme from './theme';
import './App.css';
import SetupView from './components/SetupView';
import FraudCasesView from './components/FraudCasesView';

function FraudCasesViewWrapper() {
  const { sessionId } = useParams<{ sessionId: string }>();
  return <FraudCasesView sessionId={sessionId || ''} />;
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
    path: '/load/session/:id',
    element: <NotFoundView />, // TODO: Implement session loading view
  },
  {
    path: '/api/fraud_cases/:id',
    element: <NotFoundView />, // TODO: Implement case detail view
  },
  {
    path: '/api/session/:id/export',
    element: <NotFoundView />, // TODO: Implement export view
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
