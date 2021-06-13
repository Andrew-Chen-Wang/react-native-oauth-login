import React from 'react';
import {StyleSheet, SafeAreaView} from 'react-native';
// import {ImageBackground, StyleSheet, SafeAreaView} from 'react-native';

// const Page = ({children}) => (
//   <ImageBackground
//     source={require('../assets/background.jpg')}
//     /* eslint-disable-next-line react-native/no-inline-styles */
//     style={[styles.background, {width: '100%', height: '100%'}]}>
//     <SafeAreaView style={styles.safe}>{children}</SafeAreaView>
//   </ImageBackground>
// );

const Page = ({children}) => (
  <SafeAreaView style={styles.safe}>{children}</SafeAreaView>
);

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 40,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  safe: {
    flex: 1,
  },
});

export default Page;
