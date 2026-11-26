export const palette = [
  "#F17854",
  "#9C7CEC",
  "#46B9A7",
  "#E5AF41",
  "#64A7E7",
  "#DC79AC",
];
export const palettes = {
  club: palette,
  aurora: ["#9B8BF4", "#65BDD1", "#E898C4", "#96BD7D", "#ECB56E", "#769DEB"],
  garden: ["#65A987", "#C89553", "#749EBA", "#C7839D", "#A3B65F", "#A08DC2"],
};
export const themes = {
  light: {
    bg: "#F6F5F1",
    surface: "#FFFFFF",
    text: "#192A34",
    muted: "#52656D",
    border: "#DEE5E4",
    brand: "#3F43B9",
    soft: "#ECECFA",
    board: "#233942",
    empty: "#354D56",
  },
  dark: {
    bg: "#111E25",
    surface: "#1D3039",
    text: "#F5F8F6",
    muted: "#B5C8D0",
    border: "#3D5661",
    brand: "#A8AAFF",
    soft: "#303E5D",
    board: "#09171D",
    empty: "#2A414B",
  },
  contrast: {
    bg: "#FFFFFF",
    surface: "#FFFFFF",
    text: "#000000",
    muted: "#303030",
    border: "#111111",
    brand: "#272080",
    soft: "#EEEEFF",
    board: "#000000",
    empty: "#FFFFFF",
  },
};
export type Settings = {
  theme: keyof typeof themes;
  patterns: boolean;
  motion: boolean;
  lowEffects: boolean;
  haptics: boolean;
  textSize: number;
  readable: boolean;
  language: "en" | "hi" | "mr";
  reminder: number;
  quiet: boolean;
  palette: keyof typeof palettes;
};
export const defaults: Settings = {
  theme: "light",
  patterns: false,
  motion: true,
  lowEffects: false,
  haptics: false,
  textSize: 1,
  readable: false,
  language: "en",
  reminder: 20,
  quiet: false,
  palette: "club",
};
export const strings = {
  en: {
    play: "Play",
    club: "Club",
    you: "You",
    hello: "A little room for play.",
    tag: "Clear your mind. Make your move.",
    solo: "Play Solo",
    resume: "Resume Solo",
    faceoff: "Face-Off",
    league: "Your club",
    learn: "Learn to play",
    practice: "Beginner practice",
    family: "Family duel",
    settings: "Make yourself comfortable",
    confirm: "Place block",
    cancel: "Cancel",
    home: "Home",
    help: "Choose a piece. Tap a cell for its top-left corner. Check the preview, then place. Full rows and columns clear together.",
    end: "Finish round",
    hint: "Free hint",
    save: "Save",
    back: "Back",
    results: "Round complete",
  },
  hi: {
    play: "खेलें",
    club: "क्लब",
    you: "आप",
    hello: "खेल के लिए थोड़ा समय।",
    tag: "मन शांत करें। अपनी चाल चलें।",
    solo: "अकेले खेलें",
    resume: "खेल जारी रखें",
    faceoff: "मुकाबला",
    league: "आपका क्लब",
    learn: "खेलना सीखें",
    practice: "शुरुआती अभ्यास",
    family: "परिवार मुकाबला",
    settings: "अपनी सुविधा चुनें",
    confirm: "ब्लॉक रखें",
    cancel: "रद्द करें",
    home: "मुख्य पृष्ठ",
    help: "एक टुकड़ा चुनें। उसके ऊपरी बाएँ कोने के लिए खाने पर टैप करें। झलक देखकर ब्लॉक रखें। पूरी पंक्तियाँ और स्तंभ एक साथ मिटते हैं।",
    end: "राउंड समाप्त करें",
    hint: "मुफ़्त संकेत",
    save: "सहेजें",
    back: "वापस",
    results: "राउंड पूरा",
  },
  mr: {
    play: "खेळा",
    club: "क्लब",
    you: "तुम्ही",
    hello: "खेळासाठी थोडा वेळ.",
    tag: "मन शांत करा. तुमची चाल खेळा.",
    solo: "एकटे खेळा",
    resume: "खेळ पुढे सुरू करा",
    faceoff: "सामना",
    league: "तुमचा क्लब",
    learn: "खेळायला शिका",
    practice: "नवशिक्यांचा सराव",
    family: "कौटुंबिक सामना",
    settings: "तुमच्या सोयी निवडा",
    confirm: "ब्लॉक ठेवा",
    cancel: "रद्द करा",
    home: "मुख्य पान",
    help: "एक तुकडा निवडा. त्याच्या वरच्या डाव्या कोपऱ्यासाठी चौकटीवर टॅप करा. झलक तपासून ब्लॉक ठेवा. पूर्ण ओळी व स्तंभ एकत्र मिटतात.",
    end: "फेरी संपवा",
    hint: "मोफत संकेत",
    save: "जतन करा",
    back: "मागे",
    results: "फेरी पूर्ण",
  },
};
export const motionSpec = {
  settle: 160,
  clear: 240,
  score: 360,
  screen: 220,
  stagger: 18,
};
