import React, { useEffect, useState, useContext, useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator, SectionList, RefreshControl, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ThemeToggle from "../../ui/theme/ThemeToggle";
import api, { fetchUserInfo } from "../../lib/api";
import { SessionContext } from "../../state/session";
import { useTheme } from "../../state/theme";

const DAY_ORDER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

export default function TeacherScheduleScreen() {
  const { theme } = useTheme();
  const { clearSession } = useContext(SessionContext);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);

  const load = async () => {
    try {
      setError(null);
      setLoading(true);

      const user = await fetchUserInfo(true);
      if (!user?.OgretmenID) {
        throw new Error("Öğretmen ID bulunamadı");
      }

      const res = await api.post("/teacher/schedule", { id: user.OgretmenID });
      const list = Array.isArray(res?.data) ? res.data : [];

      setData(list);
    } catch (e) {
      setError(e?.message || "Bilinmeyen bir hata oluştu");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sections = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    const byDay = data.reduce((acc, item) => {
      const gun = item.Gun || item.gun || item.day || "";
      const key = typeof gun === "string" ? gun : String(gun);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    const orderedDays = Object.keys(byDay).sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
    return orderedDays.map((d) => ({
      title: d,
      data: byDay[d].sort((a, b) => (a.DersSaati || a.Saat || a.saat || "").localeCompare(b.DersSaati || b.Saat || b.saat || "")),
    }));
  }, [data]);

  const renderLoading = () => (
    <View style={[styles.center, { backgroundColor: theme.background }]}> 
      <ActivityIndicator size="large" color={theme.accent} />
      <Text style={[styles.info, { color: theme.text, marginTop: 8 }]}>Yükleniyor...</Text>
    </View>
  );

  const renderError = () => (
    <View style={[styles.center, { backgroundColor: theme.background }]}> 
      <Text style={[styles.error, { color: theme.danger }]}>Hata: {error}</Text>
      <Text style={[styles.link, { color: theme.accent }]} onPress={load}>Tekrar dene</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={[styles.center, { backgroundColor: theme.background }]}> 
      <Ionicons name="calendar-outline" size={28} color={theme.muted || theme.text} />
      <Text style={[styles.info, { color: theme.text, marginTop: 6 }]}>Gösterilecek ders programı bulunamadı.</Text>
    </View>
  );

  const renderItem = ({ item }) => {
    const saat = item.DersSaati || item.Saat || item.saat || "";
    const ders = item.Ders || item.ders || item.DersAdi || "";
    const sinif = item.Sinif || item.sinif || item.SinifAdi || "";
    const ogretmen = item.Ogretmen || item.ogretmen || item.OgretmenAdi || "";
    return (
      <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <View style={[styles.rowIconWrap, { backgroundColor: theme.accent + "22" }]}>
          <Ionicons name="book-outline" size={18} color={theme.accent} />
        </View>
        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
            {ders} <Text style={[styles.rowTime, { color: theme.muted || theme.text }]}>({saat})</Text>
          </Text>
          <View style={styles.rowMetaWrap}>
            <View style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.surface }]}>
              <Ionicons name="layers-outline" size={14} color={theme.text} style={{ marginRight: 4 }} />
              <Text style={[styles.chipText, { color: theme.text }]} numberOfLines={1}>{sinif}</Text>
            </View>
            <View style={[styles.chip, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
              <Ionicons name="person-outline" size={14} color={theme.text} style={{ marginRight: 4 }} />
              <Text style={[styles.chipText, { color: theme.text }]} numberOfLines={1}>{ogretmen}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={[styles.header, { borderBottomColor: theme.border }]}> 
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ders Programı</Text>
        <View style={[styles.headerBtn, { marginRight: 16 }]}> 
          <ThemeToggle />
        </View>
      </View>

      {loading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : !sections.length ? (
        renderEmpty()
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item?.id || item?.Saat || index}`}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  info: { fontSize: 14 },
  error: { fontSize: 14, fontWeight: "600" },
  link: { marginTop: 6, fontSize: 14, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 14, borderBottomWidth: 1 },
  headerBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  sectionHeader: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, marginVertical: 6 },
  rowIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 10 },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "700" },
  rowTime: { fontSize: 13, fontWeight: "500" },
  rowMetaWrap: { flexDirection: "row", marginTop: 6 },
  chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, marginRight: 8 },
  chipText: { fontSize: 12, fontWeight: "600" },
});


