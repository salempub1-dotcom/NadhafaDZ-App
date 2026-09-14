import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { colors, heroFallbackImage, heroImage } from '@/ui/theme';

export function MintBackground({ children }: PropsWithChildren) {
  return (
    <View style={styles.background}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />
      <View style={styles.softGlow} />
      {children}
    </View>
  );
}

export function PhotoFadeHero({ height = 260, children }: PropsWithChildren<{ height?: number }>) {
  const [fallback, setFallback] = useState(false);

  return (
    <View style={[styles.heroWrap, { height }]}>
      <ImageBackground
        source={fallback ? heroFallbackImage : heroImage}
        style={styles.hero}
        resizeMode="cover"
        onError={() => setFallback(true)}
      >
        <View style={styles.photoTint} />
        <View style={styles.fadeTop} />
        <View style={styles.fadeMid} />
        <View style={styles.fadeBottom} />
        <View style={styles.waveOne} />
        <View style={styles.waveTwo} />
        <View style={styles.heroContent}>{children}</View>
      </ImageBackground>
    </View>
  );
}

export function CitySilhouette() {
  return (
    <View style={styles.city} pointerEvents="none">
      {[22, 38, 29, 48, 33, 56, 27, 43, 31, 51, 34, 46].map((h, i) => (
        <View key={i} style={[styles.building, { height: h, opacity: 0.10 + (i % 3) * 0.025 }]} />
      ))}
      <View style={styles.leafA} />
      <View style={styles.leafB} />
      <View style={styles.cityLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  blob: { position: 'absolute', backgroundColor: colors.decorative, borderRadius: 999 },
  blobTop: { width: 300, height: 300, right: -130, top: -110, opacity: 0.5 },
  blobBottom: { width: 250, height: 250, left: -125, bottom: 54, opacity: 0.34 },
  softGlow: { position: 'absolute', width: 360, height: 360, borderRadius: 180, backgroundColor: '#FFFFFF', opacity: 0.46, left: -80, top: 250 },
  heroWrap: { width: '100%', overflow: 'hidden', backgroundColor: '#DDEFE5' },
  hero: { flex: 1, width: '100%', justifyContent: 'flex-end', overflow: 'hidden' },
  photoTint: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(7,60,50,0.06)' },
  fadeTop: { position: 'absolute', left: 0, right: 0, bottom: 94, height: 82, backgroundColor: 'rgba(245,250,247,0.06)' },
  fadeMid: { position: 'absolute', left: 0, right: 0, bottom: 42, height: 84, backgroundColor: 'rgba(245,250,247,0.42)' },
  fadeBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 54, backgroundColor: colors.background },
  waveOne: { position: 'absolute', left: -70, right: -70, bottom: 14, height: 68, borderRadius: 999, backgroundColor: 'rgba(227,242,233,0.64)', transform: [{ rotate: '-4deg' }] },
  waveTwo: { position: 'absolute', left: -90, right: -90, bottom: -22, height: 78, borderRadius: 999, backgroundColor: colors.background, transform: [{ rotate: '3deg' }] },
  heroContent: { paddingHorizontal: 22, paddingBottom: 54, zIndex: 3 },
  city: { height: 74, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 5, opacity: 0.82, marginTop: 4 },
  building: { width: 18, backgroundColor: colors.primary, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  leafA: { position: 'absolute', width: 48, height: 20, borderRadius: 24, backgroundColor: colors.primary, opacity: 0.09, left: 18, bottom: 10, transform: [{ rotate: '-24deg' }] },
  leafB: { position: 'absolute', width: 54, height: 20, borderRadius: 24, backgroundColor: colors.primary, opacity: 0.07, right: 14, bottom: 18, transform: [{ rotate: '28deg' }] },
  cityLine: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: colors.decorative, opacity: 0.9 },
});