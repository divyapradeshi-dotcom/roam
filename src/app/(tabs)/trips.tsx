import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TripsScreen() {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>YOUR JOURNEYS</Text>
        <Text style={styles.title}>Trips</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your next chapter starts here</Text>
          <Text style={styles.copy}>
            Save a stay you love and it will be ready for you when it’s time to plan.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 26 },
  eyebrow: {
    color: "#8D7AB8",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 8,
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 36,
    letterSpacing: -1.8,
  },
  card: { marginTop: 24, padding: 22, borderRadius: 22, backgroundColor: "#F6F5F8" },
  cardTitle: { color: "#111116", fontFamily: "Manrope_800ExtraBold", fontSize: 17 },
  copy: {
    marginTop: 7,
    color: "#777780",
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    lineHeight: 20,
  },
});
