import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Fraud Detection AI',
    description: 'Our AI monitors transaction patterns in real-time to stop suspicious activity before it happens.',
    icon: 'shield-checkmark',
    color: '#6A0DAD'
  },
  {
    id: '2',
    title: 'Safety Heatmaps',
    description: 'Visualise high-risk zones in your city. Pivota warns you when you enter areas with high fraud reports.',
    icon: 'map',
    color: '#EF4444'
  },
  {
    id: '3',
    title: 'Split & Request',
    description: 'Easily split bills with friends and send requests instantly without the awkward conversations.',
    icon: 'people',
    color: '#0288D1'
  }
];

export default function Onboarding() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const router = useRouter();
  const flatListRef = useRef(null);

  const updateCurrentSlideIndex = (e: any) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / width);
    setCurrentSlideIndex(currentIndex);
  };

  const handleNext = () => {
    if (currentSlideIndex < SLIDES.length - 1) {
      (flatListRef.current as any).scrollToIndex({ index: currentSlideIndex + 1 });
    } else {
      router.replace('/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={updateCurrentSlideIndex}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={100} color={item.color} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {SLIDES.map((_, index) => (
            <View key={index} style={[styles.indicator, currentSlideIndex === index && styles.activeIndicator]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>
            {currentSlideIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  slide: { width, alignItems: 'center', justifyContent: 'center', padding: 40 },
  iconContainer: { width: 200, height: 200, borderRadius: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  textContainer: { alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 15 },
  description: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24 },
  footer: { paddingHorizontal: 40, paddingBottom: 50 },
  indicatorContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  indicator: { height: 4, width: 10, backgroundColor: '#E5E7EB', marginHorizontal: 4, borderRadius: 2 },
  activeIndicator: { backgroundColor: '#6A0DAD', width: 25 },
  nextBtn: { backgroundColor: '#6A0DAD', padding: 20, borderRadius: 18, alignItems: 'center' },
  nextBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});