"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type BarcodeScannerProps = {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
};

export function BarcodeScanner({
  isOpen,
  onClose,
  onScanSuccess,
}: BarcodeScannerProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(
    null,
  );
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "barcode-scanner-viewport";

  async function stopScanner() {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Barcode scanner stop failed:", err);
      } finally {
        scannerRef.current = null;
      }
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const startScanner = async () => {
      try {
        setErrorMsg(null);

        // 카메라 권한 확인 및 디바이스 탐색
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          setErrorMsg("사용할 수 있는 카메라 장치를 찾지 못했습니다.");
          return;
        }

        setHasCameraPermission(true);

        const html5Qrcode = new Html5Qrcode(elementId);
        scannerRef.current = html5Qrcode;

        // 모바일 기기의 후면 카메라(environment) 우선 매칭
        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: (viewfinderWidth, viewfinderHeight) => ({
              width: Math.floor(viewfinderWidth * 0.82),
              height: Math.min(180, Math.floor(viewfinderHeight * 0.36)),
            }),
            videoConstraints: {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              advanced: [
                {
                  focusMode: "continuous",
                } as MediaTrackConstraintSet,
              ],
            },
          },
          (decodedText) => {
            onScanSuccess(decodedText);
            stopScanner();
          },
          () => {
            // 매 프레임 디코딩 실패 로그는 콘솔 도배 방지를 위해 음소거
          },
        );
      } catch (err) {
        console.error("Barcode scanner start failed:", err);
        setHasCameraPermission(false);
        setErrorMsg(
          "카메라 권한이 거부되었거나 카메라 스트림에 접근할 수 없습니다. HTTPS 환경 여부를 확인해 주세요.",
        );
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, onScanSuccess]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-300 ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      }`}
    >
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl animate-fade-up">
        <header className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-xl font-black text-emerald-950">
            바코드 카메라 스캔
          </h3>
          <button
            className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </header>

        <main className="my-5">
          <p className="mb-4 text-sm leading-relaxed text-slate-500">
            삼각김밥, 도시락 등의 2D 바코드를 화면 가운데 가이드 상자 안에
            맞춰 주세요. 너무 가까우면 초점이 흐려지므로 15~25cm 정도
            떨어뜨린 뒤 천천히 맞추는 편이 안정적입니다.
          </p>

          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-emerald-950/10 bg-black">
            <div className="w-full h-full [&_video]:object-cover" id={elementId} />

            {hasCameraPermission && !errorMsg ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex h-[150px] w-[84%] animate-pulse-glow items-center justify-center rounded-xl border-4 border-dashed border-orange-500 bg-orange-500/5">
                  <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-black text-white">
                    15~25cm 거리 유지
                  </span>
                </div>
              </div>
            ) : null}

            {errorMsg ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-5 text-center text-white">
                <span className="mb-2 text-3xl">⚠️</span>
                <p className="text-sm font-semibold leading-relaxed">
                  {errorMsg}
                </p>
                <button
                  className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold transition hover:bg-emerald-800"
                  onClick={onClose}
                  type="button"
                >
                  닫기
                </button>
              </div>
            ) : null}
          </div>
        </main>

        <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <p className="mr-auto max-w-52 text-xs leading-5 text-slate-500">
            실패하면 뒤로 물러나거나, 등록 화면의 바코드 직접 입력을 사용하세요.
          </p>
          <button
            className="rounded-xl border border-emerald-900/15 bg-white px-5 py-2.5 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50"
            onClick={onClose}
            type="button"
          >
            취소
          </button>
        </footer>
      </div>
    </div>
  );
}
