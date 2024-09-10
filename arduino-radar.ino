#include <NewPing.h>
#include <Servo.h>

constexpr int TRIG_PIN = 12;
constexpr int ECHO_PIN = 11;
constexpr int MAX_DETECT_DISTANCE = 200;
constexpr int READINGS_COUNT = 5;
constexpr int MAX_CONSECUTIVE_ZEROS = 3;
constexpr int SERVO_PIN = 9;
constexpr int MIN_ANGLE = 15; // Minimum rotation angle for the servo
constexpr int MAX_ANGLE = 165; // Maximum rotation angle for the servo
constexpr int CENTER_ANGLE = 90;
constexpr int SCAN_SPEED = 1;
constexpr unsigned long SCAN_INTERVAL = 40;

enum class ScanDirection {
    COUNTER_CLOCKWISE,
    CLOCKWISE
};

NewPing sonar(TRIG_PIN, ECHO_PIN, MAX_DETECT_DISTANCE);
Servo myServo;

class DistanceFilter {
private:
  int readings[READINGS_COUNT];
  int readIndex = 0;
  int total = 0;
  float filteredDistance;
  int lastValidReading = MAX_DETECT_DISTANCE;
  int consecutiveZeroCount = 0;
  float alpha = 0.5;

public:
  DistanceFilter() {
    for (int i = 0; i < READINGS_COUNT; i++) {
      readings[i] = MAX_DETECT_DISTANCE;
    }
    total = MAX_DETECT_DISTANCE * READINGS_COUNT;
    filteredDistance = MAX_DETECT_DISTANCE;
  }

  float filter(int currentReading) {
    int adjustedReading = handleZeroReading(currentReading);
    
    // Use Simple Moving Average (SMA) to reduce the impact of random errors
    total -= readings[readIndex];
    readings[readIndex] = adjustedReading;
    total += readings[readIndex];
    readIndex = (readIndex + 1) % READINGS_COUNT;
    float sma = total / READINGS_COUNT;
    
    /**
     * Apply Exponential Moving Average (EMA) filtering algorithm.
     * Alpha determines the influence of new values on the filtered result,
     * affecting responsiveness and smoothness.
     * A larger alpha value makes the filter respond more quickly to new changes,
     * while a smaller alpha value results in a smoother output.
     */
    filteredDistance = alpha * sma + (1 - alpha) * filteredDistance;
    
    return filteredDistance;
  }

private:
  /**
   * Handle zero readings:
   * 1. If the number of consecutive zeros is greater than or equal to MAX_CONSECUTIVE_ZEROS,
   *    assume the object is out of detection range and set the result to MAX_DETECT_DISTANCE.
   * 2. If the number of consecutive zeros is less than MAX_CONSECUTIVE_ZEROS,
   *    treat it as an occasional occurrence and use the last non-zero reading as the result.
   */
  int handleZeroReading(int reading) {
    if (reading == 0) {
      consecutiveZeroCount++;
      if (consecutiveZeroCount >= MAX_CONSECUTIVE_ZEROS) {
        lastValidReading = MAX_DETECT_DISTANCE;
      }
    } else {
      consecutiveZeroCount = 0;
      lastValidReading = reading;
    }
    return lastValidReading;
  }
};

DistanceFilter distanceFilter;

int currentAngle = CENTER_ANGLE;
ScanDirection currentDirection = ScanDirection::COUNTER_CLOCKWISE;
unsigned long lastScanTime = 0;

void setup() {
    myServo.attach(SERVO_PIN);
    Serial.begin(9600);
    myServo.write(CENTER_ANGLE);
    delay(1000);
}

void loop() {
    // Use non-blocking delay design to ensure long-term program operation without overflow
    unsigned long currentTime = millis();
    if (currentTime - lastScanTime >= SCAN_INTERVAL) {
        rotateRadar();
        measureAndReportDistance();
        lastScanTime = currentTime;
    }
}

void rotateRadar() {
    switch (currentDirection) {
        case ScanDirection::COUNTER_CLOCKWISE:
            currentAngle += SCAN_SPEED;
            if (currentAngle >= MAX_ANGLE) {
                currentAngle = MAX_ANGLE;
                currentDirection = ScanDirection::CLOCKWISE;
            }
            break;
        case ScanDirection::CLOCKWISE:
            currentAngle -= SCAN_SPEED;
            if (currentAngle <= MIN_ANGLE) {
                currentAngle = MIN_ANGLE;
                currentDirection = ScanDirection::COUNTER_CLOCKWISE;
            }
            break;
    }
    myServo.write(currentAngle);
}

void measureAndReportDistance() {
    float distance = distanceFilter.filter(sonar.ping_cm());
    Serial.print(currentAngle);
    Serial.print(",");
    Serial.println(distance);
}