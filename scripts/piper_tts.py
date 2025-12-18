#!/usr/bin/env python3
"""
Piper TTS script for generating speech from text.
Usage: python3 piper_tts.py --text "Hello world" --output output.wav --model en_US-lessac-medium
"""

import argparse
import sys
import os
import urllib.request
from pathlib import Path

try:
    from piper import PiperVoice
except ImportError:
    print("Error: piper-tts is not installed. Run: pip install piper-tts", file=sys.stderr)
    sys.exit(1)


def download_model(model_name: str, models_dir: str) -> tuple[str, str]:
    """
    Download Piper voice model if it doesn't exist.
    Returns paths to model file and config file.
    """
    model_file = os.path.join(models_dir, f"{model_name}.onnx")
    config_file = os.path.join(models_dir, f"{model_name}.onnx.json")

    # Create models directory if it doesn't exist
    os.makedirs(models_dir, exist_ok=True)

    # Check if files already exist
    if os.path.exists(model_file) and os.path.exists(config_file):
        print(f"Model already exists: {model_name}", file=sys.stderr)
        return model_file, config_file

    print(f"Downloading Piper voice model: {model_name}", file=sys.stderr)

    # Parse model name to get voice and quality (e.g., en_US-ljspeech-high -> ljspeech/high)
    parts = model_name.split("-")
    if len(parts) >= 3:
        voice_name = parts[1]  # e.g., ljspeech
        quality = parts[2]     # e.g., high
    else:
        print(f"Invalid model name format: {model_name}", file=sys.stderr)
        raise ValueError(f"Model name must be in format: en_US-<voice>-<quality>")

    # Download model file
    model_url = f"https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/{voice_name}/{quality}/{model_name}.onnx"
    config_url = f"https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/{voice_name}/{quality}/{model_name}.onnx.json"

    try:
        print(f"Downloading {model_url}...", file=sys.stderr)
        urllib.request.urlretrieve(model_url, model_file)

        print(f"Downloading {config_url}...", file=sys.stderr)
        urllib.request.urlretrieve(config_url, config_file)

        print(f"Model downloaded successfully: {model_name}", file=sys.stderr)
        return model_file, config_file
    except Exception as e:
        print(f"Error downloading model: {e}", file=sys.stderr)
        # Clean up partial downloads
        if os.path.exists(model_file):
            os.remove(model_file)
        if os.path.exists(config_file):
            os.remove(config_file)
        raise


def get_models_dir() -> str:
    """
    Get the models directory path.
    Uses environment variable if set, otherwise uses relative path from project root.
    """
    if "PIPER_MODELS_DIR" in os.environ:
        return os.environ["PIPER_MODELS_DIR"]

    # Use relative path from project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)  # Go up from scripts/ to project root
    return os.path.join(project_root, "data", "piper-models")


def main():
    parser = argparse.ArgumentParser(description="Generate speech using Piper TTS")
    parser.add_argument("--text", required=True, help="Text to synthesize")
    parser.add_argument("--output", required=True, help="Output WAV file path (use '-' for stdout)")
    parser.add_argument(
        "--model",
        default="en_US-ljspeech-high",
        help="Voice model name (default: en_US-ljspeech-high)",
    )
    parser.add_argument(
        "--model-path",
        default=None,
        help="Path to piper models directory (optional, auto-detected if not specified)",
    )

    args = parser.parse_args()

    # Get models directory
    models_dir = args.model_path if args.model_path else get_models_dir()

    print(f"Using models directory: {models_dir}", file=sys.stderr)

    # Download model if it doesn't exist (will use cached version if available)
    try:
        model_file, config_file = download_model(args.model, models_dir)
    except Exception as e:
        print(f"Error: Failed to download model: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        print(f"Loading Piper voice model from: {model_file}", file=sys.stderr)
        print(f"Using config: {config_file}", file=sys.stderr)

        # Load the voice model
        voice = PiperVoice.load(model_file, config_path=config_file)

        print(f"Synthesizing text: {args.text[:50]}...", file=sys.stderr)

        # Synthesize speech and write to WAV file or stdout
        import wave
        import io

        # Determine output mode
        output_to_stdout = args.output == "-"

        if output_to_stdout:
            # Write to an in-memory buffer
            buffer = io.BytesIO()
            with wave.open(buffer, "wb") as wav_file:
                # Check if synthesize_wav method exists (newer piper-tts versions)
                if hasattr(voice, "synthesize_wav"):
                    voice.synthesize_wav(args.text, wav_file)
                else:
                    # Older piper-tts versions: synthesize() writes directly to wav_file
                    # but we need to set up the wave file parameters first
                    wav_file.setnchannels(1)  # Piper outputs mono audio
                    wav_file.setsampwidth(2)  # 16-bit audio (2 bytes per sample)
                    wav_file.setframerate(voice.config.sample_rate)
                    voice.synthesize(args.text, wav_file)

            # Get the audio data
            audio_data = buffer.getvalue()
            print(f"Audio generated: {len(audio_data)} bytes", file=sys.stderr)

            if len(audio_data) == 0:
                print("WARNING: Generated audio is empty!", file=sys.stderr)
                sys.exit(1)

            # Write binary data to stdout
            sys.stdout.buffer.write(audio_data)
            sys.stdout.buffer.flush()
        else:
            # Create output directory if it doesn't exist
            output_path = Path(args.output)
            output_path.parent.mkdir(parents=True, exist_ok=True)

            with wave.open(args.output, "wb") as wav_file:
                # Check if synthesize_wav method exists (newer piper-tts versions)
                if hasattr(voice, "synthesize_wav"):
                    voice.synthesize_wav(args.text, wav_file)
                else:
                    # Older piper-tts versions: synthesize() writes directly to wav_file
                    # but we need to set up the wave file parameters first
                    wav_file.setnchannels(1)  # Piper outputs mono audio
                    wav_file.setsampwidth(2)  # 16-bit audio (2 bytes per sample)
                    wav_file.setframerate(voice.config.sample_rate)
                    voice.synthesize(args.text, wav_file)

            # Verify file was created and has content
            file_size = os.path.getsize(args.output)
            print(f"Audio file created: {args.output} ({file_size} bytes)", file=sys.stderr)

            if file_size == 0:
                print("WARNING: Generated audio file is empty!", file=sys.stderr)
                sys.exit(1)

            print("SUCCESS", file=sys.stderr)  # Signal success to stderr when writing to file

        sys.exit(0)

    except Exception as e:
        print(f"Error during synthesis: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
