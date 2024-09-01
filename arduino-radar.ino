#include <NewPing.h>

#define TRIGGER_PIN  12
#define ECHO_PIN     11
#define MAX_DETECT_DISTANCE 200

NewPing sonar(TRIGGER_PIN, ECHO_PIN, MAX_DETECT_DISTANCE);

const int READINGS_COUNT = 5;
const int MAX_CONSECUTIVE_ZEROS = 3;

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
    
    // 使用簡單移動平均（Simple Moving Average，SMA）來減少隨機誤差影響
    total -= readings[readIndex];
    readings[readIndex] = adjustedReading;
    total += readings[readIndex];
    readIndex = (readIndex + 1) % READINGS_COUNT;
    float sma = total / READINGS_COUNT;
    
    /**
     * 使用指數移動平均（Exponential Moving Average，EMA）濾波算法
     * alpha 是新數值對對濾波結果的影響程度，影響響應性和平滑程度。
     * 較大的 alpha 值會使濾波器更快地響應新的變化，較小的 alpha 值則會使輸出更平滑。
     */
    filteredDistance = alpha * sma + (1 - alpha) * filteredDistance;
    
    return filteredDistance;
  }

private:
  /**
   * 處理讀數為 0 的狀況：
   * 1. 若不小於最大連續可為零次數（MAX_CONSECUTIVE_ZEROS），則視為物體位於偵測範圍外，將結果設定為最大可偵測距離（MAX_DISTANCE）
   * 2. 若小於最大連續可為零次數，則視為偶發狀況，使用上一次偵測到的非 0 讀數為此次結果
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

void setup() {
  Serial.begin(115200);
}

void loop() {
  delay(50);
  
  float distance = distanceFilter.filter(sonar.ping_cm());
  
  Serial.print(distance);
  Serial.println(" cm");
}