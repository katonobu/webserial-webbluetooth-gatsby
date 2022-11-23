import { red } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';

// A custom theme for this app
const theme = createTheme({
  typography: {
    button: {
      textTransform: "none"
    }
  },
  palette: {
    primary: {
//      main: '#556cd6', // value at supplied by https://github.com/mui-org/material-ui/blob/master/examples/gatsby/src/theme.js
      main: '#3498db', // value of http://localhost:8000/commons.css --toastify-color-info
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
  },
});

export default theme;
