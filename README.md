# 🎮 Gaming Vibe

A simple TypeScript React application for managing your game collection.

## 🚀 [Live Demo](https://jeanroldao.github.io/gaming-vibe/)

Check out the live preview of the application in action!

## Features

- ✨ Add games to your collection
- ✅ Mark games as completed
- 🗑️ Remove games from your list
- 📊 Track your progress with stats
- 🎨 Clean, modern UI with dark/light mode support
- 🎮 Xbox Controller support with gamepad navigation

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

### Lint

Check code quality:

```bash
npm run lint
```

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **ESLint** - Code linting

## Xbox Controller Support

This app supports Xbox controllers for navigation and control. When a controller is connected, you'll see a controller hint at the top of the screen.

### Controller Mappings

- **D-Pad / Left Analog Stick**: Navigate through menu items
- **A Button**: Select/activate the focused item
- **B Button**: Close on-screen keyboard
- **X Button**: Open on-screen keyboard when input field is focused

### Troubleshooting Xbox Controller on Chrome/Windows 11

If your Xbox One controller isn't working:

1. **Check Controller Connection**:
   - Ensure your controller is properly connected (wired or Bluetooth)
   - Open Chrome DevTools (F12) and go to the Console tab
   - Look for messages starting with `[App]` and `[useGamepad]`

2. **Verify Gamepad API Detection**:
   - You should see `[useGamepad] Initialization:` message showing your controller details
   - The message will include: controller ID, number of buttons, and axes
   - Example: `id: "Xbox 360 Controller (XInput STANDARD GAMEPAD)"`

3. **Test Button Presses**:
   - Press any button on your controller
   - Check the Console for `[useGamepad] Button pressed:` messages
   - This will show which button index is being triggered

4. **Common Issues**:
   - **Controller not detected**: Try unplugging and replugging the controller
   - **Chrome needs interaction**: Click on the page first, then try the controller
   - **Check browser permissions**: Ensure Chrome has permission to use the gamepad
   - **Update Chrome**: Make sure you're using the latest version of Chrome

5. **Share Debug Info**:
   - If issues persist, copy the console logs and share them
   - The logs will help identify if it's a detection, mapping, or event issue

## Screenshots

### Empty State
![Empty State](https://github.com/user-attachments/assets/b44f6784-4c0e-4990-84d7-e741a04bb1df)

### With Games
![With Games](https://github.com/user-attachments/assets/1380b51d-7499-4bb1-a3ff-4de376cae646)
