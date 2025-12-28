package models

// AlertSettings represents customizable alert box settings
type AlertSettings struct {
	// Visual Settings
	Theme           string `json:"theme"`            // "default" or "custom"
	BackgroundColor string `json:"background_color"` // hex color e.g. "#FE6244"
	TextColor       string `json:"text_color"`       // hex color e.g. "#FFFFFF"
	AccentColor     string `json:"accent_color"`     // hex color for amount e.g. "#FBBF24"
	FontFamily      string `json:"font_family"`      // "inter", "poppins", "roboto", "comic-sans"
	FontSize        string `json:"font_size"`        // "small", "medium", "large"

	// Animation Settings
	Animation string `json:"animation"` // "slide", "fade", "bounce", "pop", "zoom"
	Duration  int    `json:"duration"`  // display duration in seconds (3-10)

	// Audio Settings
	SoundEnabled bool   `json:"sound_enabled"`
	SoundFile    string `json:"sound_file"`   // "default", "coin", "bell", "chime"
	SoundVolume  int    `json:"sound_volume"` // 0-100
}

// DefaultAlertSettings returns the default alert settings
func DefaultAlertSettings() AlertSettings {
	return AlertSettings{
		Theme:           "default",
		BackgroundColor: "#FE6244",
		TextColor:       "#FFFFFF",
		AccentColor:     "#FBBF24",
		FontFamily:      "inter",
		FontSize:        "medium",
		Animation:       "slide",
		Duration:        5,
		SoundEnabled:    false,
		SoundFile:       "default",
		SoundVolume:     50,
	}
}
