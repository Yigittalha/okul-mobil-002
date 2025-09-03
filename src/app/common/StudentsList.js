import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  TextInput,
  Linking,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { fetchAllStudents, getUploadUrl } from "../../lib/api";
import { useTheme } from "../../state/theme";
import { SessionContext } from "../../state/session";
import { useSlideMenu } from "../../navigation/SlideMenuContext";
import ThemeToggle from "../../ui/theme/ThemeToggle";

const StudentItem = ({ student, theme }) => {
  const [expanded, setExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    setExpanded(!expanded);

    Animated.spring(animation, {
      toValue,
      friction: 7,
      tension: 70,
      useNativeDriver: true,
    }).start();
  };

  const arrowRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  const getGenderText = (gender) => {
    return gender === true || gender === "1" ? "Erkek" : "Kız";
  };

  const makePhoneCall = async (phoneNumber, parentName) => {
    if (!phoneNumber || phoneNumber === "-" || phoneNumber.trim() === "") {
      Alert.alert("Hata", `${parentName} telefon numarası bulunamadı.`);
      return;
    }

    try {
      const phoneUrl = `tel:${phoneNumber.trim()}`;
      const supported = await Linking.canOpenURL(phoneUrl);
      
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert("Hata", "Telefon arama özelliği desteklenmiyor.");
      }
    } catch (error) {
      Alert.alert("Hata", "Telefon araması başlatılamadı.");
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.studentCard, { 
        backgroundColor: theme.card || '#FFFFFF',
        shadowColor: theme.text || '#000'
      }]}
      onPress={toggleExpand}
    >
      <View style={styles.cardContent}>
        <View style={styles.mainInfo}>
          <View style={styles.avatarSection}>
            {student.Fotograf && student.Fotograf !== "-" ? (
              <Image
                source={{ uri: getUploadUrl(student.Fotograf) }}
                style={styles.profileImage}
                defaultSource={require("../../../assets/icon.png")}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accent || '#2563EB' }]}>
                <Text style={styles.avatarEmoji}>
                  {getGenderText(student.Cinsiyet) === "Erkek" ? "👦" : "👧"}
                </Text>
              </View>
            )}
            <View style={[styles.numberBadge, { backgroundColor: theme.accent || '#2563EB' }]}>
              <Text style={styles.numberText}>{student.OgrenciNumara}</Text>
            </View>
          </View>

          <View style={styles.studentDetails}>
            <Text style={[styles.fullName, { color: theme.text || '#111827' }]}>
              {student.AdSoyad}
            </Text>
            <View style={styles.classInfo}>
              <View style={[styles.classTag, { backgroundColor: (theme.accent || '#2563EB') + '10' }]}>
                <Text style={[styles.classLabel, { color: theme.accent || '#2563EB' }]}>
                  {student.Sinif}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionArea}>
          <Animated.View style={[styles.chevronButton, { transform: [{ rotate: arrowRotation }] }]}>
            <Text style={[styles.chevronIcon, { color: theme.textSecondary || '#6B7280' }]}>▼</Text>
          </Animated.View>
        </View>
      </View>

      {expanded && (
        <View style={[styles.expandedSection, { borderTopColor: theme.border || '#E5E7EB' }]}>
          <View style={styles.detailsContainer}>
            <View style={[styles.infoItem, { backgroundColor: theme.surface || '#F8FAFC' }]}>
              <Text style={[styles.infoTitle, { color: theme.textSecondary || '#64748B' }]}>
                TC Kimlik No
              </Text>
              <Text style={[styles.infoText, { color: theme.text || '#0F172A' }]}>
                {student.TCKimlikNo}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.textSecondary || theme.text },
                ]}
              >
                👤 Cinsiyet:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {getGenderText(student.Cinsiyet)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.textSecondary || theme.text },
                ]}
              >
                🎂 Doğum Tarihi:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {formatDate(student.DogumTarihi)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.textSecondary || theme.text },
                ]}
              >
                👩 Anne:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {student.AnneAdSoyad}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.textSecondary || theme.text },
                ]}
              >
                👨 Baba:
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {student.BabaAdSoyad}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.textSecondary || theme.text },
                ]}
              >
                📞 Anne Tel:
              </Text>
              <View style={styles.phoneRow}>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {student.AnneTel}
                </Text>
                <TouchableOpacity
                  style={[styles.callButton, { backgroundColor: theme.accent || '#2563EB' }]}
                  onPress={() => makePhoneCall(student.AnneTel, "Anne")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.callButtonText}>Ara</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.textSecondary || theme.text },
                ]}
              >
                📞 Baba Tel:
              </Text>
              <View style={styles.phoneRow}>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {student.BabaTel}
                </Text>
                <TouchableOpacity
                  style={[styles.callButton, { backgroundColor: theme.accent || '#2563EB' }]}
                  onPress={() => makePhoneCall(student.BabaTel, "Baba")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.callButtonText}>Ara</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const StudentsList = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { openMenu } = useSlideMenu();
  const [searchText, setSearchText] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllStudents();

      if (data && Array.isArray(data)) {
        setStudents(data);
        setFilteredStudents(data); // Başlangıçta tüm öğrencileri göster
      } else {
        // Use mock data when API fails
        const mockData = getMockStudents();
        setStudents(mockData);
        setFilteredStudents(mockData); // Başlangıçta tüm öğrencileri göster
      }
    } catch (error) {
      console.error("❌ Error loading students:", error);
      // Use mock data when API fails
      const mockData = getMockStudents();
      setStudents(mockData);
      setFilteredStudents(mockData); // Başlangıçta tüm öğrencileri göster
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // searchText'i bağımlılık olarak kaldırdık

  const getMockStudents = () => {
    return [
      {
        Sinif: "5-A",
        OgrenciNumara: "1",
        AdSoyad: "Ahmet Yılmaz",
        TCKimlikNo: "56781234567",
        Cinsiyet: true,
        DogumTarihi: "2013-04-12T00:00:00.000Z",
        AnneAdSoyad: "Fatma Yılmaz",
        BabaAdSoyad: "Mehmet Yılmaz",
        VeliDurum: true,
        Sag: "Var",
        Engel: false,
        AnneEgitim: "Lise",
        BabaEgitim: "Üniversite",
        AnneMeslek: "Ev Hanımı",
        BabaMeslek: "Memur",
        SuregenRahatsizlik: "Yok",
        AylikGelir: "15000",
        AnneTel: "05001112233",
        BabaTel: "05002223344",
        Fotograf: "default.png",
        OgrenciId: 34,
      },
      {
        Sinif: "5-A",
        OgrenciNumara: "2",
        AdSoyad: "Ayşe Demir",
        TCKimlikNo: "65872345678",
        Cinsiyet: false,
        DogumTarihi: "2013-06-18T00:00:00.000Z",
        AnneAdSoyad: "Zeynep Demir",
        BabaAdSoyad: "Ali Demir",
        VeliDurum: true,
        Sag: "Var",
        Engel: false,
        AnneEgitim: "Üniversite",
        BabaEgitim: "Üniversite",
        AnneMeslek: "Öğretmen",
        BabaMeslek: "Mühendis",
        SuregenRahatsizlik: "Yok",
        AylikGelir: "20000",
        AnneTel: "05003334455",
        BabaTel: "05004445566",
        Fotograf: "default.png",
        OgrenciId: 35,
      },
    ];
  };

  // İlk açılışta öğrenci verilerini al
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Öğrenci verisi alındığında filtrelenmiş listeyi de güncelle
  useEffect(() => {
    filterStudents();
  }, [searchText, students]); // students'ı da ekledik çünkü öğrenciler değiştiğinde de filtreleme yapmalıyız

  // Arama metni değiştiğinde öğrencileri filtrele (API çağrısı yapmadan)
  const filterStudents = () => {
    if (!students.length) return; // Öğrenci yoksa işlem yapma

    if (searchText.trim() === "") {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(
      (student) =>
        student.AdSoyad &&
        student.AdSoyad.toLowerCase().includes(searchText.toLowerCase()),
    );
    setFilteredStudents(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudents();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => openMenu("StudentsList")}
        >
          <Text style={[styles.menuIcon, { color: theme.text }]}>☰</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Tüm Öğrenciler
        </Text>

        <ThemeToggle />
      </View>

      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputWrapper,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Text
            style={[
              styles.searchIcon,
              { color: theme.textSecondary || theme.muted },
            ]}
          >
            🔍
          </Text>
          <TextInput
            style={[
              styles.searchInput,
              {
                color: theme.text,
              },
            ]}
            placeholder="Aramak istediğiniz öğrencinin adını girin"
            placeholderTextColor={
              theme.textSecondary || theme.muted || theme.text
            }
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchText("")}
            >
              <Text style={{ color: theme.textSecondary || theme.muted }}>
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: theme.background },
          ]}
        >
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Öğrenciler yükleniyor...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          renderItem={({ item }) => (
            <StudentItem student={item} theme={theme} />
          )}
          keyExtractor={(item) => item.OgrenciId.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.text }]}>
                {searchText.trim() !== ""
                  ? "Arama kriterine uygun öğrenci bulunamadı."
                  : "Öğrenci bulunamadı."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  menuButton: {
    padding: 10,
  },
  menuIcon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarSection: {
    position: 'relative',
    marginRight: 12,
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  numberBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  studentDetails: {
    flex: 1,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  classLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionArea: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronIcon: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandedSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailsContainer: {
    gap: 8,
  },
  infoItem: {
    padding: 12,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 2,
  },
  callButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 10,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingRight: 10,
  },
  clearButton: {
    padding: 8,
  },
});

export default StudentsList;
