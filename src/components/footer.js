import React from 'react'
import Link from '../components/Link';
import Copyright from '../components/Copyright';

const Footer = () => {
    return (
        <div>
            <Link to="/about" color="secondary">
                Go to the about page
            </Link>
            <Copyright />
        </div>            
    );
}

export default Footer;
