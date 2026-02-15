import frame01 from "../../assets/ultrasound/frame_01.png";
import frame02 from "../../assets/ultrasound/frame_02.png";
import frame03 from "../../assets/ultrasound/frame_03.png";
import frame04 from "../../assets/ultrasound/frame_04.png";
import frame05 from "../../assets/ultrasound/frame_05.png";
import frame06 from "../../assets/ultrasound/frame_06.png";
import frame07 from "../../assets/ultrasound/frame_07.png";
import frame08 from "../../assets/ultrasound/frame_08.png";
import frame09 from "../../assets/ultrasound/frame_09.png";
import frame10 from "../../assets/ultrasound/frame_10.png";

export interface UltrasoundImageData {
  id: string;
  url: string;
  name: string;
}

export const SAMPLE_ULTRASOUND_IMAGES: UltrasoundImageData[] = [
  {
    id: "us-001",
    url: frame01,
    name: "Wrist Scan #1",
  },
  {
    id: "us-002",
    url: frame02,
    name: "Wrist Scan #2",
  },
  {
    id: "us-003",
    url: frame03,
    name: "Wrist Scan #3",
  },
  {
    id: "us-004",
    url: frame04,
    name: "Wrist Scan #4",
  },
  {
    id: "us-005",
    url: frame05,
    name: "Wrist Scan #5",
  },
  {
    id: "us-006",
    url: frame06,
    name: "Wrist Scan #6",
  },
  {
    id: "us-007",
    url: frame07,
    name: "Wrist Scan #7",
  },
  {
    id: "us-008",
    url: frame08,
    name: "Wrist Scan #8",
  },
  {
    id: "us-009",
    url: frame09,
    name: "Wrist Scan #9",
  },
  {
    id: "us-010",
    url: frame10,
    name: "Wrist Scan #10",
  },
];

/**
* Future ultrasound device data import interface
*
* This function will connect to a real ultrasound device API in the future.
* Possible implementation methods:
*
* 1. Connect to the device via USB/serial port
* 2. Retrieve data from the device through a network API
* 3. Read from the DICOM file system
* 4. Receive real-time device data via WebSocket
 * 
 * Example implementation:
 * 
 * export async function importFromUltrasoundDevice(): Promise<UltrasoundImageData[]> {
 *   const response = await fetch('http://ultrasound-device.local/api/images', {
 *     method: 'GET',
 *     headers: {
 *       'Authorization': 'Bearer DEVICE_TOKEN',
 *     },
 *   });
 *   
 *   const deviceData = await response.json();
 *   
 *   return deviceData.images.map((img: any) => ({
 *     id: img.id,
 *     url: img.imageUrl || `data:image/jpeg;base64,${img.base64Data}`,
 *     name: img.studyName,
 *   }));
 * }
 */
export async function importFromUltrasoundDevice(): Promise<UltrasoundImageData[]> {
  // Currently returns mock example data
  // Will be replaced with real instrument API calls in the future
  return SAMPLE_ULTRASOUND_IMAGES;
}
