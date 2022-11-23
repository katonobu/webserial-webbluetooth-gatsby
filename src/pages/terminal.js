import * as React from 'react';
import Layout from '../components/layout'
import WebSerialConnectButton from '../features/serial/webSerialConnectButton';
import SerialButtons from '../features/cmdRsp/serialButtons';

import loadable from '@loadable/component'

const XTerm = loadable(() => import('../components/xterm.js'));

export default function Terminal() {
  return (
    <Layout>
      <WebSerialConnectButton></WebSerialConnectButton>
      <SerialButtons></SerialButtons>
      <XTerm></XTerm>
    </Layout>
  );
}
