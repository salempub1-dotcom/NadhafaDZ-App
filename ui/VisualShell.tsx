import type { PropsWithChildren } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { colors, heroImage } from '@/ui/theme';

export function MintBackground({ children }: PropsWithChildren) {
  return (
    <View style={styles.background}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />
      {children}
    </View>
  );
}

export function PhotoFadeHero({ height = 260, children }: PropsWithChildren<{ height?: number }>) {
  return (
    <ImageBackground source={heroImage} style={[styles.hero, { height }]} resizeMode="cover">
      <View style={styles.photoTint} />
      <View style={styles.fadeOne} />
      <View style={styles.fadeTwo} />
      <View style={styles.fadeThree} />
      <View style={styles.heroContent}>{children}</View>
    </ImageBackground>
  );
}

export function CitySilhouette() {
  return (
    <View style={styles.city} pointerEvents="none">
      {[22, 38, 29, 48, 33, 56, 27, 43, 31, 51].map((h, i) => (
        <View key={i} style={[styles.building, { height: h, opacity: 0.12 + (i % 3) * 0.03 }]} />
      ))}
      <View style={styles.leafA} />
      <View style={styles.leafB} />
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  blob: { position: 'absolute', backgroundColor: colors.decorative, borderRadius: 999, opacity: 0.6 },
  blobTop: { width: 280, height: 280, right: -120, top: -90 },
  blobBottom: { width: 220, height: 220, left: -110, bottom: 70, opacity: 0.42 },
  hero: { width: '100%', justifyContent: 'flex-end', overflow: 'hidden' },
  photoTint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,60,50,0.16)' },
  fadeOne: { position: 'absolute', left: 0, right: 0, bottom: 52, height: 70, backgroundColor: 'rgba(245,250,247,0.18)' },
  fadeTwo: { position: 'absolute', left: 0, right: 0, bottom: 24, height: 65, backgroundColor: 'rgba(245,250,247,0.56)' },
  fadeThree: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 52, backgroundColor: colors.background },
  heroContent: { paddingHorizontal: 22, paddingBottom: 58 },
  city: { height: 70, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 5, opacity: 0.75 },
  building: { width: 20, backgroundColor: colors.primary, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  leafA: { position: 'absolute', width: 42, height: 18, borderRadius: 24, backgroundColor: colors.primary, opacity: 0.1, left: 22, bottom: 8, transform: [{ rotate: '-24deg' }] },
  leafB: { position: 'absolute', width: 48, height: 19, borderRadius: 24, backgroundColor: colors.primary, opacity: 0.08, right: 16, bottom: 16, transform: [{ rotate: '28deg' }] },
});
