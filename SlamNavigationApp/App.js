import React from 'react';
import { StatusBar } from 'react-native';
import SlamNavigator from './src/components/SlamNavigator';

/**
 * Main App component
 * SLAM Navigation App with ORB-SLAM3 and Dead Reckoning
 */
const App = () => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <SlamNavigator />
    </>
  );
};

export default App;
