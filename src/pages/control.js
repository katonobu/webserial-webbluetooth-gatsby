import * as React from 'react';
import Layout from '../components/layout'
import WebSerialConnectButton from '../features/serial/webSerialConnectButton';
import SerialButtons from '../features/cmdRsp/serialButtons';

export default function Terminal() {
  return (
    <Layout>
      <WebSerialConnectButton></WebSerialConnectButton>
      <SerialButtons></SerialButtons>
    </Layout>
  );
}
