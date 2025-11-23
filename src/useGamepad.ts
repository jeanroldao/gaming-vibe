import { useEffect, useRef, useCallback } from 'react'

export interface GamepadConfig {
  onUp?: () => void
  onDown?: () => void
  onLeft?: () => void
  onRight?: () => void
  onA?: () => void // A button (bottom face button)
  onB?: () => void // B button (right face button)
  onX?: () => void // X button (left face button)
  onY?: () => void // Y button (top face button)
  onStart?: () => void
  onSelect?: () => void
}

// Xbox controller button indices
const BUTTON_A = 0
const BUTTON_B = 1
const BUTTON_X = 2
const BUTTON_Y = 3
const BUTTON_START = 9
const BUTTON_SELECT = 8

// Threshold for analog stick to register as pressed
const STICK_THRESHOLD = 0.5

export const useGamepad = (config: GamepadConfig) => {
  const lastButtonState = useRef<boolean[]>([])
  const lastAxisState = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false
  })
  const animationFrameId = useRef<number | undefined>(undefined)
  const configRef = useRef(config)
  const isMounted = useRef(true)
  const lastGamepadIndex = useRef<number | null>(null)

  // Update config ref whenever config changes
  useEffect(() => {
    configRef.current = config
  }, [config])

  // Reset state when gamepad changes
  const resetGamepadState = useCallback(() => {
    lastButtonState.current = []
    lastAxisState.current = {
      up: false,
      down: false,
      left: false,
      right: false
    }
  }, [])

  const checkGamepad = useCallback(() => {
    if (!isMounted.current) {
      return
    }

    const gamepads = navigator.getGamepads()
    const gamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3]

    if (!gamepad) {
      // Reset state when no gamepad is connected
      if (lastGamepadIndex.current !== null) {
        lastGamepadIndex.current = null
        resetGamepadState()
      }
      // Continue polling even without a gamepad
      animationFrameId.current = requestAnimationFrame(checkGamepad)
      return
    }

    // Find the current gamepad index
    const currentIndex = gamepads.indexOf(gamepad)
    
    // If gamepad index changed, reset state
    if (lastGamepadIndex.current !== currentIndex) {
      lastGamepadIndex.current = currentIndex
      resetGamepadState()
    }

    // Initialize button state array if needed
    if (lastButtonState.current.length === 0) {
      lastButtonState.current = new Array(gamepad.buttons.length).fill(false)
    }

    // Check buttons
    gamepad.buttons.forEach((button, index) => {
      const isPressed = button.pressed
      const wasPressed = lastButtonState.current[index]

      // Only trigger on button press (not on release or hold)
      if (isPressed && !wasPressed) {
        switch (index) {
          case BUTTON_A:
            configRef.current.onA?.()
            break
          case BUTTON_B:
            configRef.current.onB?.()
            break
          case BUTTON_X:
            configRef.current.onX?.()
            break
          case BUTTON_Y:
            configRef.current.onY?.()
            break
          case BUTTON_START:
            configRef.current.onStart?.()
            break
          case BUTTON_SELECT:
            configRef.current.onSelect?.()
            break
        }
      }

      lastButtonState.current[index] = isPressed
    })

    // Check D-pad and left analog stick
    const dpadUp = gamepad.buttons[12]?.pressed || gamepad.axes[1] < -STICK_THRESHOLD
    const dpadDown = gamepad.buttons[13]?.pressed || gamepad.axes[1] > STICK_THRESHOLD
    const dpadLeft = gamepad.buttons[14]?.pressed || gamepad.axes[0] < -STICK_THRESHOLD
    const dpadRight = gamepad.buttons[15]?.pressed || gamepad.axes[0] > STICK_THRESHOLD

    // Trigger on state change from not pressed to pressed
    if (dpadUp && !lastAxisState.current.up) {
      configRef.current.onUp?.()
    }
    if (dpadDown && !lastAxisState.current.down) {
      configRef.current.onDown?.()
    }
    if (dpadLeft && !lastAxisState.current.left) {
      configRef.current.onLeft?.()
    }
    if (dpadRight && !lastAxisState.current.right) {
      configRef.current.onRight?.()
    }

    lastAxisState.current = {
      up: dpadUp,
      down: dpadDown,
      left: dpadLeft,
      right: dpadRight
    }

    animationFrameId.current = requestAnimationFrame(checkGamepad)
  }, [resetGamepadState])

  useEffect(() => {
    isMounted.current = true
    
    // Handle gamepad connection/disconnection events
    const handleGamepadConnected = () => {
      resetGamepadState()
    }
    
    const handleGamepadDisconnected = () => {
      resetGamepadState()
    }
    
    window.addEventListener('gamepadconnected', handleGamepadConnected)
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected)
    
    // Start polling
    animationFrameId.current = requestAnimationFrame(checkGamepad)

    return () => {
      isMounted.current = false
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      window.removeEventListener('gamepadconnected', handleGamepadConnected)
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected)
    }
  }, [checkGamepad, resetGamepadState])
}
