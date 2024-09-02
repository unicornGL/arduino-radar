#include <NewPing.h>
#include <Servo.h>

constexpr int TRIG_PIN = 12;
constexpr int ECHO_PIN = 11;
constexpr int MAX_DETECT_DISTANCE = 200;
constexpr int READINGS_COUNT = 5;
constexpr int MAX_CONSECUTIVE_ZEROS = 3;
constexpr int SERVO_PIN = 9;
constexpr int MIN_ANGLE = 15;
constexpr int MAX_ANGLE = 165;
constexpr int CENTER_ANGLE = 90;
constexpr int SCAN_SPEED = 1;
constexpr unsigned long SCAN_INTERVAL = 15;

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
    
    // 使用簡單移動平均（Simple Moving Average，SMA）來減少隨機誤差影響。
    total -= readings[readIndex];
    readings[readIndex] = adjustedReading;
    total += readings[readIndex];
    readIndex = (readIndex + 1) % READINGS_COUNT;
    float sma = total / READINGS_COUNT;
    
    /**
     * 使用指數移動平均（Exponential Moving Average，EMA）濾波算法。
     * alpha 是新數值對對濾波結果的影響程度，影響響應性和平滑程度。
     * 較大的 alpha 值會使濾波器更快地響應新的變化，較小的 alpha 值則會使輸出更平滑。
     */
    filteredDistance = alpha * sma + (1 - alpha) * filteredDistance;
    
    return filteredDistance;
  }

private:
  /**
   * 處理讀數為 0 的狀況：
   * 1. 若不小於最大連續可為零次數（MAX_CONSECUTIVE_ZEROS），則視為物體位於偵測範圍外，將結果設定為最大可偵測距離（MAX_DISTANCE）。
   * 2. 若小於最大連續可為零次數，則視為偶發狀況，使用上一次偵測到的非 0 讀數為此次結果。
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
    // 使用非阻塞延時設計可以確保程式長時間運行且不會發生溢位
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
    Serial.print("角度: ");
    Serial.print(currentAngle);
    Serial.print(", 距離: ");
    Serial.print(distance);
    Serial.println(" cm");
}