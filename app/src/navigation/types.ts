import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type RootStackParamList = {
  MainTabs: undefined;
  PlaceDetails: { id: string };
};

export type MainTabParamList = {
  Places: undefined;
  Collection: undefined;
};

export type AppNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
