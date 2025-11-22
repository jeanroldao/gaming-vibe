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

  const checkGamepad = useCallback(() => {
    const gamepads = navigator.getGamepads()
    const gamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3]

    if (!gamepad) {
      // If no gamepad, check again in 500ms instead of every frame
      setTimeout(() => {
        if (animationFrameId.current !== undefined) {
          animationFrameId.current = requestAnimationFrame(checkGamepad)
        }
      }, 500)
      return
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
            config.onA?.()
            break
          case BUTTON_B:
            config.onB?.()
            break
          case BUTTON_X:
            config.onX?.()
            break
          case BUTTON_Y:
            config.onY?.()
            break
          case BUTTON_START:
            config.onStart?.()
            break
          case BUTTON_SELECT:
            config.onSelect?.()
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
      config.onUp?.()
    }
    if (dpadDown && !lastAxisState.current.down) {
      config.onDown?.()
    }
    if (dpadLeft && !lastAxisState.current.left) {
      config.onLeft?.()
    }
    if (dpadRight && !lastAxisState.current.right) {
      config.onRight?.()
    }

    lastAxisState.current = {
      up: dpadUp,
      down: dpadDown,
      left: dpadLeft,
      right: dpadRight
    }

    animationFrameId.current = requestAnimationFrame(checkGamepad)
  }, [config])

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(checkGamepad)

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [checkGamepad])
}
