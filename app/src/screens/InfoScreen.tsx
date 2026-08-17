import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Linking from "expo-linking";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "../AppState";
import { getPlace } from "../data";
import { localizePlace, translate } from "../i18n";
import { BrandMark } from "../components/BrandMark";
import { LanguagePicker } from "../components/LanguagePicker";
import { PlaceMap } from "../components/PlaceMap";
import type { AppNavigationProp } from "../navigation/types";
import { categoryColors, colors, spacing } from "../theme";
import visitorCentrePhoto from "../../assets/branding/vistycio-lankytoju-centras.jpg";

const VISITOR_CENTRE_ID = "vistycio-regioninio-parko-lankytoju-centras";

export default function InfoScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const { locale, setLocale } = useApp();
  const place = getPlace(VISITOR_CENTRE_ID);

  if (!place) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>{translate(locale, "common.error")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const content = localizePlace(place, locale);
  const location = [place.address, place.city, place.municipality]
    .filter(Boolean)
    .join(" · ");
  const category = place.categories[0] ?? "";
  const phone = place.contact?.phone ?? "";
  const email = place.contact?.email ?? "";
  const website = place.contact?.website ?? "";
  const websiteDisplay = website
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const openingHours = place.openingHours;
  const placeMapRegion = {
    latitude: place.coordinates[1],
    longitude: place.coordinates[0],
    latitudeDelta: 0.018,
    longitudeDelta: 0.024,
  };

  function openExternal(url: string) {
    void Linking.openURL(url).catch(() => undefined);
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headingGroup}>
            <BrandMark size="medium" />
            <View style={styles.heading}>
              <Text style={styles.eyebrow}>{translate(locale, "app.title")}</Text>
              <Text style={styles.title}>{translate(locale, "info.title")}</Text>
              <Text style={styles.subtitle}>{translate(locale, "info.subtitle")}</Text>
            </View>
          </View>
          <LanguagePicker value={locale} onChange={setLocale} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons color={colors.primaryDark} name="information" size={27} />
            </View>
            <Text style={styles.heroKicker}>{translate(locale, "info.visitorCentre")}</Text>
          </View>
          <Text style={styles.heroTitle}>{content.name}</Text>
          <Text style={styles.heroDescription}>{content.description}</Text>
        </View>

        <View style={styles.photoCard}>
          <View style={styles.photoFrame}>
            <Image
              accessibilityLabel={content.name}
              resizeMode="contain"
              source={visitorCentrePhoto}
              style={styles.photo}
            />
          </View>
          <View style={styles.photoCaption}>
            <Text style={styles.photoCaptionKicker}>
              {translate(locale, "info.visitorCentre")}
            </Text>
            <Text style={styles.photoCaptionTitle}>{content.name}</Text>
          </View>
        </View>

        <InfoSectionTitle icon="sparkles-outline" title={translate(locale, "info.about")} />
        <View style={styles.card}>
          <Text style={styles.body}>{content.text}</Text>
        </View>

        <InfoSectionTitle icon="call-outline" title={translate(locale, "info.contact")} />
        <View style={styles.card}>
          {phone ? (
            <ContactRow
              action={translate(locale, "info.call")}
              icon="call-outline"
              label={translate(locale, "info.phone")}
              onPress={() => openExternal(`tel:${phone.replaceAll(" ", "")}`)}
              value={phone}
            />
          ) : null}
          {email ? (
            <ContactRow
              action={translate(locale, "info.writeEmail")}
              icon="mail-outline"
              label={translate(locale, "info.email")}
              onPress={() => openExternal(`mailto:${email}`)}
              value={email}
            />
          ) : null}
        </View>

        <InfoSectionTitle icon="time-outline" title={translate(locale, "info.openingHours")} />
        <View style={styles.card}>
          <HoursRow
            label={translate(locale, "info.weekdays")}
            value={openingHours?.tuesdayFriday ?? "—"}
          />
          <HoursRow
            label={translate(locale, "info.saturday")}
            value={openingHours?.saturday ?? "—"}
          />
          <HoursRow
            label={translate(locale, "info.sundayMonday")}
            value={
              openingHours?.sundayMondayClosed
                ? translate(locale, "info.closed")
                : "—"
            }
            valueStyle={styles.closedValue}
          />
          <View style={styles.note}>
            <Ionicons color={colors.secondaryDark} name="alert-circle-outline" size={18} />
            <Text style={styles.noteText}>{translate(locale, "info.holidayNote")}</Text>
          </View>
        </View>

        <InfoSectionTitle icon="location-outline" title={translate(locale, "info.location")} />
        <View style={styles.locationCard}>
          <View style={styles.mapPreview}>
            <PlaceMap
              initialRegion={placeMapRegion}
              locale={locale}
              onPlacePress={() => navigation.navigate("PlaceDetails", { id: place.id })}
              userLocation={null}
              visiblePlaces={[place]}
            />
          </View>
          <View style={styles.locationContent}>
            <View style={styles.locationHeader}>
              <View
                style={[
                  styles.locationIcon,
                  { backgroundColor: categoryColors[category] ?? colors.primary },
                ]}
              >
                <Ionicons color={colors.white} name="location" size={21} />
              </View>
              <View style={styles.locationCopy}>
                <Text style={styles.locationTitle}>{content.name}</Text>
                <Text style={styles.locationValue}>{location}</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate("PlaceDetails", { id: place.id })}
              style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
            >
              <Ionicons color={colors.white} name="map-outline" size={18} />
              <Text style={styles.primaryActionText}>
                {translate(locale, "info.viewPlace")}
              </Text>
            </Pressable>
          </View>
        </View>

        {website ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => openExternal(website)}
            style={({ pressed }) => [styles.websiteCard, pressed && styles.pressed]}
          >
            <View style={styles.websiteIcon}>
              <Ionicons color={colors.primary} name="globe-outline" size={22} />
            </View>
            <View style={styles.websiteCopy}>
              <Text style={styles.websiteLabel}>{translate(locale, "info.website")}</Text>
              <Text style={styles.websiteValue}>{websiteDisplay}</Text>
            </View>
            <Ionicons color={colors.primary} name="open-outline" size={19} />
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoSectionTitle({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.sectionTitle}>
      <Ionicons color={colors.primary} name={icon} size={18} />
      <Text style={styles.sectionTitleText}>{title}</Text>
    </View>
  );
}

function ContactRow({
  action,
  icon,
  label,
  onPress,
  value,
}: {
  action: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  value: string;
}) {
  return (
    <View style={styles.contactRow}>
      <View style={styles.contactIcon}>
        <Ionicons color={colors.primary} name={icon} size={18} />
      </View>
      <View style={styles.contactCopy}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text selectable style={styles.contactValue}>
          {value}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.contactAction, pressed && styles.pressed]}
      >
        <Text style={styles.contactActionText}>{action}</Text>
      </Pressable>
    </View>
  );
}

function HoursRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.hoursRow}>
      <Text style={styles.hoursLabel}>{label}</Text>
      <Text style={[styles.hoursValue, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    position: "relative",
    zIndex: 20,
    elevation: 20,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headingGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  heading: {
    flex: 1,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 2,
    color: colors.ink,
    fontFamily: "Georgia",
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  heroCard: {
    marginTop: spacing.sm,
    padding: spacing.lg,
    borderRadius: 24,
    backgroundColor: colors.primary,
    zIndex: 1,
  },
  photoCard: {
    alignSelf: "stretch",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    marginTop: spacing.md,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  photoFrame: {
    alignSelf: "stretch",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    aspectRatio: 1.987,
    overflow: "hidden",
    backgroundColor: colors.paperSoft,
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
  },
  photoCaption: {
    padding: spacing.md,
  },
  photoCaptionKicker: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  photoCaptionTitle: {
    marginTop: 3,
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  heroIcon: {
    width: 45,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: colors.secondary,
  },
  heroKicker: {
    flex: 1,
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  heroTitle: {
    marginTop: spacing.md,
    color: colors.white,
    fontFamily: "Georgia",
    fontSize: 25,
    fontWeight: "800",
    lineHeight: 31,
  },
  heroDescription: {
    marginTop: spacing.sm,
    color: "#f8dedb",
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitleText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  card: {
    padding: spacing.md,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 58,
  },
  contactIcon: {
    width: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
  },
  contactCopy: {
    flex: 1,
    minWidth: 0,
  },
  contactLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  contactValue: {
    marginTop: 2,
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  contactAction: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: colors.paperSoft,
  },
  contactActionText: {
    color: colors.primaryDark,
    fontSize: 10,
    fontWeight: "900",
  },
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 42,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  hoursLabel: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  hoursValue: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
  },
  closedValue: {
    color: colors.muted,
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.secondaryLight,
  },
  noteText: {
    flex: 1,
    color: colors.secondaryDark,
    fontSize: 11,
    lineHeight: 17,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  locationCard: {
    overflow: "hidden",
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  mapPreview: {
    height: 220,
    backgroundColor: colors.map,
  },
  locationContent: {
    padding: spacing.md,
  },
  locationIcon: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  locationCopy: {
    flex: 1,
    minWidth: 0,
  },
  locationTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "900",
  },
  locationValue: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 46,
    marginTop: spacing.md,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  primaryActionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },
  websiteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
  },
  websiteIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  websiteCopy: {
    flex: 1,
  },
  websiteLabel: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  websiteValue: {
    marginTop: 3,
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.76,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  notFoundTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
});
