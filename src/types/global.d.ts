export {}

declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
    gm_authFailure: () => void;
    selectDriver: (driverId: string) => void;
  }
  
  namespace google.maps {
    namespace marker {
      class AdvancedMarkerElement {
        constructor(options?: {
          position?: LatLng | LatLngLiteral;
          map?: Map;
          title?: string;
          content?: HTMLElement;
          gmpDraggable?: boolean;
        });
        position: LatLng | LatLngLiteral | null;
        map: Map | null;
        title: string | null;
        content: HTMLElement | null;
        addListener(eventName: string, handler: (event: unknown) => void): MapsEventListener;
      }
      
      class PinElement {
        constructor(options?: {
          background?: string;
          borderColor?: string;
          glyphColor?: string;
          scale?: number;
        });
        element: HTMLElement;
      }
    }
  }
}