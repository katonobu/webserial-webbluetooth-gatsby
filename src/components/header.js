import React from 'react'
import Typography from '@mui/material/Typography';
import Link from '../components/Link';

const Header = ()=>{
    return (
        <>
        <Typography variant="h4" component="h1" color="primary" gutterBottom>
        Web Serial Example
        </Typography>
        <Link to="/"> CONENCT </Link>
        <Link to="/control"> CONTROL </Link>
        <Link to="/terminal"> TERMINAL </Link>
        <Link to="/about" color="secondary"> ABOUT </Link>
        </>        
    );
}

export default Header;
