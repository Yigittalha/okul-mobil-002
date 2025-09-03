import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
import { useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import api, { fetchUserInfo } from "../../lib/api";
import ThemeToggle from "../../ui/theme/ThemeToggle";

export default function StudentScheduleScreen() {
  const { theme } = useTheme();
  const { session } = useContext(SessionContext);
  const navigation = useNavigation();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    fetchSchedule();
    return () => { mountedRef.current = false; };
  }, []);

  const fetchSchedule = async () => {
    try {
      // Kullanıcı bilgilerini /user/info API'sinden al
      const userInfo = await fetchUserInfo(true);
      console.log("🔍 Kullanıcı bilgileri:", userInfo);
      
      if (!userInfo || !userInfo.Sinif) {
        console.log("⚠️ Sınıf bilgisi bulunamadı!");
        setError("Sınıf bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
        setLoading(false);
        return;
      }

      const sinif = userInfo.Sinif;
      console.log("🔍 Bulunan sınıf:", sinif);

      console.log("📡 Ders programı API çağrısı yapılıyor:", `/schedule/get`, { Sinif: sinif });
      const response = await api.post("/schedule/get", { Sinif: sinif });
      console.log("✅ Schedule API yanıtı:", response);
      
      if (mountedRef.current && response?.data) {
        const grouped = groupByDay(response.data);
        setSchedule(grouped);
        setError(null);
        console.log("📋 Gruplandırılmış veri:", grouped);
      }
    } catch (err) {
      if (mountedRef.current) {
        console.error("❌ Schedule fetch error:", err);
        setError("Ders programı yüklenemedi");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSchedule();
    setRefreshing(false);
  };

  const groupByDay = (data) => {
    const dayOrder = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
    const grouped = {};
    
    data.forEach(item => {
      if (!grouped[item.Gun]) grouped[item.Gun] = [];
      grouped[item.Gun].push(item);
    });

    const startMinutes = (s) => { 
      const [h,m] = s.split("-")[0].split(":").map(Number); 
      return h*60+m; 
    };

    return dayOrder
      .filter(gun => grouped[gun])
      .map(gun => ({
        title: gun,
        data: grouped[gun].sort((a, b) => startMinutes(a.DersSaati) - startMinutes(b.DersSaati))
      }));
  };

  const renderItem = ({ item }) => (
    <View style={[styles.lessonCard, { backgroundColor: theme.card }]}>
      <View style={styles.cardContent}>
        <View style={styles.timeContainer}>
          <View style={[styles.timeBadge, { backgroundColor: theme.accent + '15' }]}>
            <Text style={[styles.timeText, { color: theme.accent }]}>🕐</Text>
            <Text style={[styles.timeValue, { color: theme.accent }]}>{item.DersSaati}</Text>
          </View>
        </View>
        
        <View style={styles.lessonInfo}>
          <Text style={[styles.lessonTitle, { color: theme.text }]}>{item.Ders}</Text>
          
          <View style={styles.detailsRow}>
            <View style={styles.teacherContainer}>
              <Text style={[styles.teacherIcon, { color: theme.textSecondary }]}>👨‍🏫</Text>
              <Text style={[styles.teacherName, { color: theme.textSecondary }]}>{item.AdSoyad}</Text>
            </View>
            
            <View style={[styles.roomBadge, { backgroundColor: theme.primary }]}>
              <Text style={[styles.roomIcon, { color: theme.onPrimary }]}>📍</Text>
              <Text style={[styles.roomText, { color: theme.onPrimary }]}>{item.Derslik}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={[styles.cardAccent, { backgroundColor: theme.accent }]} />
    </View>
  );

  const getDayIcon = (day) => {
    const icons = {
      "Pazartesi": "📅",
      "Salı": "📋",
      "Çarşamba": "📊",
      "Perşembe": "📚",
      "Cuma": "🎯",
      "Cumartesi": "🌟",
      "Pazar": "☀️"
    };
    return icons[day] || "📅";
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={[styles.dayHeader, { backgroundColor: theme.card }]}>
      <View style={styles.dayHeaderContent}>
        <View style={[styles.dayIconContainer, { backgroundColor: theme.accent }]}>
          <Text style={styles.dayIcon}>{getDayIcon(title)}</Text>
        </View>
        <Text style={[styles.dayTitle, { color: theme.text }]}>{title}</Text>
        <View style={[styles.dayDivider, { backgroundColor: theme.border }]} />
      </View>
    </View>
  );

  const renderNavbar = () => (
    <View style={[styles.navbar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
      </TouchableOpacity>
      
      <Text style={[styles.navbarTitle, { color: theme.text }]}>Ders Programı</Text>
      
      <View style={styles.navbarRight}>
        <ThemeToggle />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        {renderNavbar()}
        <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Ders programı yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        {renderNavbar()}
        <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
          <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { borderColor: theme.accent }]} onPress={fetchSchedule}>
            <Text style={[styles.retryText, { color: theme.accent }]}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (schedule.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        {renderNavbar()}
        <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
          <Text style={[styles.emptyText, { color: theme.text }]}>Bu sınıf için program bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {renderNavbar()}
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <SectionList
          sections={schedule}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item, index) => `${item.Gun}-${item.DersSaati}-${index}`}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.accent]}
              tintColor={theme.accent}
              progressBackgroundColor={theme.card}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main Container Styles
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  
  // Navbar Styles
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    minHeight: 56,
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  backIcon: {
    fontSize: 26,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  navbarTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  navbarRight: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    marginRight: 20,
    marginTop: 20,
  },
  
  // Lesson Card Styles (Shadow Removed)
  lessonCard: {
    marginVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'flex-start',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  
  // Time Container Styles
  timeContainer: {
    marginRight: 16,
    alignItems: 'center',
  },
  timeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  timeText: {
    fontSize: 16,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Lesson Info Styles
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Teacher Styles
  teacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teacherIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Room Badge Styles
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  roomIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  roomText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  
  // Day Header Styles (Shadow Removed)
  dayHeader: {
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  dayHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dayIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dayIcon: {
    fontSize: 18,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dayDivider: {
    flex: 1,
    height: 1,
    marginLeft: 12,
    opacity: 0.3,
  },
  
  // Loading and Error Styles
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: '500',
  },
  retryButton: {
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 32,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: '500',
  },
});
