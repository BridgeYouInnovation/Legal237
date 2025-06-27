import OpenAI from 'openai';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';

class AudioService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    });
    this.recording = null;
    this.sound = null;
    this.isRecording = false;
    this.isPlaying = false;
  }

  async initialize() {
    try {
      // Request audio permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permissions not granted');
      }

      // Set audio mode for recording and playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log('Audio Service initialized successfully');
    } catch (error) {
      console.error('Error initializing Audio Service:', error);
      throw error;
    }
  }

  // Speech-to-Text using OpenAI Whisper
  async startRecording() {
    try {
      if (this.isRecording) {
        console.warn('Already recording');
        return;
      }

      const recordingOptions = {
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      this.recording = recording;
      this.isRecording = true;

      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async stopRecording() {
    try {
      if (!this.isRecording || !this.recording) {
        console.warn('Not currently recording');
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      this.isRecording = false;

      console.log('Recording stopped, URI:', uri);
      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  async transcribeAudio(audioUri) {
    try {
      if (!audioUri) {
        throw new Error('No audio URI provided');
      }

      console.log('Transcribing audio:', audioUri);

      // Read the audio file
      const audioInfo = await FileSystem.getInfoAsync(audioUri);
      if (!audioInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      // Create form data for OpenAI Whisper API
      const response = await FileSystem.uploadAsync(
        'https://api.openai.com/v1/audio/transcriptions',
        audioUri,
        {
          headers: {
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
          },
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          mimeType: 'audio/wav',
          parameters: {
            model: 'whisper-1',
            language: 'auto', // Auto-detect language
          },
        }
      );

      const result = JSON.parse(response.body);
      
      if (result.error) {
        throw new Error(result.error.message || 'Transcription failed');
      }

      console.log('Transcription result:', result.text);
      return result.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  // Text-to-Speech using OpenAI TTS
  async generateSpeech(text, voice = 'alloy') {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('No text provided for speech generation');
      }

      console.log('Generating speech for text:', text.substring(0, 100) + '...');

      const response = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: voice, // alloy, echo, fable, onyx, nova, shimmer
        input: text,
        response_format: 'mp3',
      });

      // Convert response to buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Save to file
      const fileUri = FileSystem.documentDirectory + 'speech_' + Date.now() + '.mp3';
      await FileSystem.writeAsStringAsync(fileUri, buffer.toString('base64'), {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('Speech generated and saved to:', fileUri);
      return fileUri;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  async playSpeech(audioUri) {
    try {
      if (this.isPlaying) {
        await this.stopSpeech();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, isLooping: false }
      );

      this.sound = sound;
      this.isPlaying = true;

      // Set up playback status update
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          this.isPlaying = false;
          this.sound = null;
        }
      });

      console.log('Playing speech');
    } catch (error) {
      console.error('Error playing speech:', error);
      throw error;
    }
  }

  async stopSpeech() {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
        this.isPlaying = false;
        console.log('Speech stopped');
      }
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }

  // Combined method: record, transcribe, and return text
  async recordAndTranscribe() {
    try {
      await this.startRecording();
      
      // Return a promise that resolves when recording is stopped
      return new Promise((resolve, reject) => {
        // Store the resolve/reject functions to be called later
        this._recordingResolve = resolve;
        this._recordingReject = reject;
      });
    } catch (error) {
      console.error('Error in recordAndTranscribe:', error);
      throw error;
    }
  }

  async finishRecordingAndTranscribe() {
    try {
      const audioUri = await this.stopRecording();
      if (!audioUri) {
        throw new Error('No audio recorded');
      }

      const transcription = await this.transcribeAudio(audioUri);
      
      // Clean up the audio file
      await FileSystem.deleteAsync(audioUri, { idempotent: true });
      
      return transcription;
    } catch (error) {
      console.error('Error finishing recording and transcribing:', error);
      throw error;
    }
  }

  // Combined method: generate and play speech
  async speakText(text, voice = 'alloy') {
    try {
      const audioUri = await this.generateSpeech(text, voice);
      await this.playSpeech(audioUri);
      
      // Clean up the audio file after playing
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(audioUri, { idempotent: true });
        } catch (error) {
          console.warn('Error cleaning up audio file:', error);
        }
      }, 5000); // Clean up after 5 seconds
      
      return audioUri;
    } catch (error) {
      console.error('Error speaking text:', error);
      throw error;
    }
  }

  // Utility methods
  getRecordingStatus() {
    return this.isRecording;
  }

  getPlaybackStatus() {
    return this.isPlaying;
  }

  async cleanup() {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }
      if (this.isPlaying) {
        await this.stopSpeech();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Create and export singleton instance
const audioService = new AudioService();
export default audioService; 