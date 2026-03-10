import { Skill, JobCategory } from "@/types";
import {
  UtensilsCrossed, ShoppingBag, PartyPopper, Scissors,
  Factory, HardHat, Truck, Megaphone, Wrench,
  Coffee, Wine, Pizza, Beef, Music,
  Shirt, Smartphone, Monitor,
  Sparkles, Building2, Package,
  MapPin, Star, Clock, Banknote, Users, Briefcase,
  Search, Bell, MessageSquare, ChevronRight, ChevronLeft,
  Home, User, Plus, Settings, Heart, Calendar,
  CheckCircle2, XCircle, AlertCircle, ArrowRight
} from "lucide-react";

export {
  UtensilsCrossed, ShoppingBag, PartyPopper, Scissors,
  Factory, HardHat, Truck, Megaphone, Wrench,
  Coffee, Wine, Pizza, Beef, Music,
  Shirt, Smartphone, Monitor,
  Sparkles, Building2, Package,
  MapPin, Star, Clock, Banknote, Users, Briefcase,
  Search, Bell, MessageSquare, ChevronRight, ChevronLeft,
  Home, User, Plus, Settings, Heart, Calendar,
  CheckCircle2, XCircle, AlertCircle, ArrowRight
};

export const categoryIcons: Record<JobCategory, typeof UtensilsCrossed> = {
  "Bares e Restaurantes": UtensilsCrossed,
  "Comércio": ShoppingBag,
  "Eventos": PartyPopper,
  "Beleza e Estética": Scissors,
  "Indústria": Factory,
  "Construção Civil": HardHat,
  "Logística": Truck,
  "Marketing e Promoção": Megaphone,
  "Serviços Gerais": Wrench,
};
