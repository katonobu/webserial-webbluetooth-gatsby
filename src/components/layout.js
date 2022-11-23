import React from 'react'
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Header from './header';
import Footer from './footer';
import WebSerialProvider from '../features/serial/webSerialProvider';

const Layout = ( props ) => {
    return (
        <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
            <WebSerialProvider>
            <Header/>
                { props.children }
            <Footer/>
            </WebSerialProvider>
        </Box>
        </Container>
    )
}

export default Layout