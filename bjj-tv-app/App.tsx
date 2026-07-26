import React from 'react';
import { SafeAreaView, StyleSheet, View, StatusBar } from 'react-native';
import TVScreen from './src/screens/TVScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={true} />
      <TVScreen />
    </SafeAreaView>
  );
}
