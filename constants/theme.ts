// Theme constants matching the spec's design direction
export const theme = {
  // Colors
  colors: {
    // Backgrounds
    background: '#0f0f0f', // Deep charcoal
    card: '#1a1a1a',       // Card surfaces
    
    // Accent (electric teal)
    accent: '#00d4aa',
    
    // Progress ring colors
    progress: {
      underTarget: '#22c55e',   // green
      over80Percent: '#f59e0b', // amber
      overTarget: '#ef4444',    // red
    },
    
    // Text
    text: {
      primary: '#ffffff',
      secondary: '#9ca3af',
      muted: '#6b7280',
    },
    
    // Other
    border: '#374151',
    error: '#ef4444',
  },
  
  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,   // base unit
    xl: 24,   // section gaps
    xxl: 32,
  },
  
  // Typography (System font stack with weight contrast)
  typography: {
    fontFamily: 'System',
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    fontSize: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 20,
      xxxl: 24,
      huge: 32,
      massive: 48,
    },
  },
  
  // Border radius
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

// Export Colors for React Navigation tabs (light/dark compatible)
export const Colors = {
  light: {
    tint: theme.colors.accent,
    background: '#ffffff',
    card: '#f3f4f6',
    text: '#000000',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
  },
  dark: {
    tint: theme.colors.accent,
    background: theme.colors.background,
    card: theme.colors.card,
    text: theme.colors.text.primary,
    textSecondary: theme.colors.text.secondary,
    border: theme.colors.border,
  },
};