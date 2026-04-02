export interface CityConfig {
  id: string;
  name: string;
  radioUrl: string;
  subtitle: string;
  tagline: string;
  cameras: string[];
  feeds: string[];
  theme: {
    primary: string;
    background: string;
    text: string;
  };
}

export interface AppConfig {
  cities: CityConfig[];
}
