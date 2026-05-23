export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  organizer_id: string;
  image_url: string;
  lat?: number;
  lng?: number;
  created_at: string;
}

export type Category = "All" | "Music" | "Tech" | "Art" | "Food" | "Sports" | "Networking";

export const CATEGORIES: Category[] = ["All", "Music", "Tech", "Art", "Food", "Sports", "Networking"];
