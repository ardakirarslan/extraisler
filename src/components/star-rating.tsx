import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

/** 1-5 star picker used on rating forms. */
export function StarRating({ score, onChange }: { score: number; onChange: (score: number) => void }) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Pressable key={value} onPress={() => onChange(value)} hitSlop={6}>
          <Ionicons name={value <= score ? 'star' : 'star-outline'} size={32} color="#F5730B" />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
});
