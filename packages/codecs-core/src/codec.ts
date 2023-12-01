/**
 * Defines an offset in bytes.
 */
export type Offset = number;

/**
 * An object that can encode a value to a `Uint8Array`.
 */
export type Encoder<T> = EncoderSize<T> & {
    /** Encode the provided value and return the encoded bytes directly. */
    readonly encode: (value: T) => Uint8Array;
    /**
     * Writes the encoded value into the provided byte array at the given offset.
     * Returns the offset of the next byte after the encoded value.
     */
    readonly write: (value: T, bytes: Uint8Array, offset: Offset) => Offset;
};

/**
 * Describes the size of an Encoder, either fixed or variable.
 */
export type EncoderSize<T> =
    | {
          /** The fixed size of the encoded value in bytes, if applicable. */
          readonly fixedSize: number;
      }
    | {
          /** Otherwise, a null fixedSize indicates it's a variable size encoder. */
          readonly fixedSize: null;
          /** The maximum size an encoded value can be in bytes, if applicable. */
          readonly maxSize?: number;
          /** The total size of the encoded value in bytes. */
          readonly variableSize: (value: T) => number;
      };

/**
 * An object that can decode a value from a `Uint8Array`.
 */
export type Decoder<T> = DecoderSize & {
    /** Decodes the provided byte array at the given offset (or zero) and returns the value directly. */
    readonly decode: (bytes: Uint8Array, offset?: Offset) => T;
    /**
     * Reads the encoded value from the provided byte array at the given offset.
     * Returns the decoded value and the offset of the next byte after the encoded value.
     */
    readonly read: (bytes: Uint8Array, offset: Offset) => [T, Offset];
};

/**
 * Describes the size of an Decoder, either fixed or variable.
 */
export type DecoderSize =
    | {
          /** The fixed size of the encoded value in bytes, if applicable. */
          readonly fixedSize: number;
      }
    | {
          /** Otherwise, a null fixedSize indicates it's a variable size encoder. */
          readonly fixedSize: null;
          /** The maximum size an encoded value can be in bytes, if applicable. */
          readonly maxSize?: number;
      };

/**
 * An object that can encode and decode a value to and from a `Uint8Array`.
 * It supports encoding looser types than it decodes for convenience.
 * For example, a `bigint` encoder will always decode to a `bigint`
 * but can be used to encode a `number`.
 *
 * @typeParam From - The type of the value to encode.
 * @typeParam To - The type of the decoded value. Defaults to `From`.
 */
export type Codec<From, To extends From = From> = Encoder<From> & Decoder<To>;

/**
 * Wraps all the attributes of an object in Codecs.
 */
export type WrapInCodec<T, U extends T = T> = {
    [P in keyof T]: Codec<T[P], U[P]>;
};

/**
 * Get the encoded size of a given value in bytes.
 */
export function getEncodedSize<T>(value: T, encoder: EncoderSize<T>): number {
    return encoder.fixedSize !== null ? encoder.fixedSize : encoder.variableSize(value);
}

/** Fills the missing `encode` function using the existing `write` function. */
export function createEncoder<T>(encoder: EncoderSize<T> & Omit<Encoder<T>, 'encode'>): Encoder<T> {
    return Object.freeze({
        ...(encoder.fixedSize === null
            ? { fixedSize: null, maxSize: encoder.maxSize, variableSize: encoder.variableSize }
            : { fixedSize: encoder.fixedSize }),
        encode: (value: T) => {
            const bytes = new Uint8Array(getEncodedSize(value, encoder));
            encoder.write(value, bytes, 0);
            return bytes;
        },
        write: encoder.write,
    });
}

/** Fills the missing `decode` function using the existing `read` function. */
export function createDecoder<T>(decoder: DecoderSize & Omit<Decoder<T>, 'decode'>): Decoder<T> {
    return Object.freeze({
        ...(decoder.fixedSize === null
            ? { fixedSize: null, maxSize: decoder.maxSize }
            : { fixedSize: decoder.fixedSize }),
        decode: (bytes: Uint8Array, offset?: Offset) => decoder.read(bytes, offset ?? 0)[0],
        read: decoder.read,
    });
}

/** Fills the missing `encode` and `decode` function using the existing `write` and `read` functions. */
export function createCodec<From, To extends From = From>(
    codec: EncoderSize<From> & Omit<Codec<From, To>, 'encode' | 'decode'>
): Codec<From, To> {
    return Object.freeze({
        ...(codec.fixedSize === null
            ? { fixedSize: null, maxSize: codec.maxSize, variableSize: codec.variableSize }
            : { fixedSize: codec.fixedSize }),
        decode: (bytes: Uint8Array, offset?: Offset) => codec.read(bytes, offset ?? 0)[0],
        encode: (value: From) => {
            const bytes = new Uint8Array(getEncodedSize(value, codec));
            codec.write(value, bytes, 0);
            return bytes;
        },
        read: codec.read,
        write: codec.write,
    });
}
