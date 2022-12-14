import * as React from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '../components/Link';
import Copyright from '../components/Copyright';

import loadable from '@loadable/component'
const XTerm = loadable(() => import('../components/xterm_component.js'));

export default function Index() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" color="primary" gutterBottom>
        Web Serial/Web Bluetooth Example
        </Typography>
        <XTerm/>
        <Link to="/about" color="secondary">
          Go to the about page
        </Link>
        <Copyright />
      </Box>
    </Container>
  );
}
