import "../components/paymentConfirmation.css";
import axios from "axios";
import dropzonePreview from "../assets/dropzone-preview.png";
import React, { useCallback, useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useParams, useNavigate } from "react-router-dom";

const thumbsContainer = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "wrap",
  marginTop: 16,
};

const thumb = {
  display: "inline-flex",
  borderRadius: 2,
  border: "1px solid #eaeaea",
  width: 300,
  // height: 163,
  padding: 0,
  boxSizing: "border-box",
};

const thumbInner = {
  display: "flex",
  // minWidth: 300,
  overflow: "hidden",
};

const img = {
  display: "block",
  width: "100%",
  height: "100%",
};

// Countdown Status
const STATUS = {
  STARTED: "Started",
  STOPPED: "Stopped",
};

const INITIAL_COUNT = 600;

const PaymentConfirmation = () => {
  const { id } = useParams();
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [orderId, setOrderId] = useState(0);
  const navigate = useNavigate();
  // Add File to preview
  const [files, setFiles] = useState([]);
  const [paymentProof, setPaymentProof] = useState("");
  const photo = localStorage.setItem("PaymentProof", paymentProof);

  // Countdown
  const [secondsRemaining, setSecondsRemaining] = useState(INITIAL_COUNT);
  const [status, setStatus] = useState(STATUS.STOPPED);
  const secondsToDisplay = secondsRemaining % 60;
  const minutesRemaining = (secondsRemaining - secondsToDisplay) / 60;
  const minutesToDisplay = minutesRemaining % 60;

  useInterval(
    () => {
      if (secondsRemaining > 0) {
        setSecondsRemaining(secondsRemaining - 1);
      }
    },
    status === STATUS.STARTED ? 1000 : null
    // passing null stops the interval
  );

  // source: https://overreacted.io/making-setinterval-declarative-with-react-hooks/
  function useInterval(callback, delay) {
    const savedCallback = useRef();

    // Remember the latest callback.
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  }

  // https://stackoverflow.com/a/2998874/1673761
  const twoDigits = (num) => String(num).padStart(2, "0");

  // Select File
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [],
    },
    onDrop: (acceptedFiles) => {
      setFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: URL.createObjectURL(file),
          })
        )
      );
    },
  });

  // To show the dropzone
  const handlePaymentConfirmed = () => {
    setPaymentConfirmed(true);
    setStatus(STATUS.STARTED);
  };

  const thumbs = files.map((file) => (
    <div style={thumb} key={file.name}>
      <div style={thumbInner}>
        <img
          src={file.preview}
          style={img}
          // Revoke data uri after image is loaded
          onLoad={() => {
            URL.revokeObjectURL(file.preview);
          }}
        />
      </div>
    </div>
  ));

  useEffect(() => {
    // Make sure to revoke the data uris to avoid memory leaks, will run on unmount
    return () => files.forEach((file) => URL.revokeObjectURL(file.preview));
  }, []);
  const handleUpload = () => {
    const config = {
      headers: {
        access_token: localStorage.getItem("loginToken"),
      },
    };

    const formData = new FormData();
    console.log(formData);
    formData.append("slip", files[0]);
    console.log(formData);
    axios
      .put(`https://bootcamp-rent-cars.herokuapp.com/customer/order/${id}/slip`, formData, config)
      .then((res) => {
        // console.log(res.data.slip);
        setPaymentProof(res.data.slip);
        // localStorage.setItem(paymentProof)
        setOrderId(res.data.id);
        setTimeout(() => {
          navigate(`/e-ticket/${id}/`);
        }, 1200);
      })
      .catch((err) => console.log(err.message));
  };

  return (
    <div className="paymentConfirmation-container">
      <div className="btn-paymentConfirmation">
        {/* Anonymous function */}
        {(() => {
          if (paymentConfirmed === true) {
            return (
              <div className="payment-confirmed-container">
                <div className="uploadPaymentProofDeadline-container">
                  <div className="firstHeading-uploadPaymentProofDeadline">
                    <h1>Konfirmasi Pembayaran</h1>
                  </div>
                  <div className="deadline-uploadPaymentProofDeadline">
                    <div>
                      {twoDigits(minutesToDisplay)}:{twoDigits(secondsToDisplay)}
                    </div>
                  </div>
                </div>
                <div className="firstP-uploadPaymentProofDeadline">
                  <p>Terima kasih telah melakukan konfirmasi pembayaran. Pembayaranmu akan segera kami cek tunggu kurang lebih 10 menit untuk mendapatkan konfirmasi.</p>
                </div>
                <div className="secondHeading-uploadPaymentProofDeadline">
                  <h1>Upload Bukti Pembayaran</h1>
                </div>
                <div className="secondP-uploadPaymentProofDeadline">
                  <p>Untuk membantu kami lebih cepat melakukan pengecekan. Kamu bisa upload bukti bayarmu</p>
                </div>
                <section className="container dropzone-outer-container">
                  <div className="dropzone-inner-container">
                    <div {...getRootProps({ className: "dropzone dropzone-upload-container" })}>
                      <input {...getInputProps()} />
                      <img src={dropzonePreview}></img>
                      <div className="select-image-dropzone">
                        <button>Click or Drop Here</button>
                      </div>
                    </div>
                    <aside style={thumbsContainer}>{thumbs}</aside>
                  </div>
                  <div className="btn-upload-paymentConfirmation">
                    <button onClick={handleUpload}>Upload</button>
                  </div>
                </section>
              </div>
            );
          } else {
            return (
              <div className="payment-unconfirmed-container">
                <div className="txt-paymentConfirmation">
                  <h1>Klik Konfirmasi Pembayaran untuk mempercepat proses pengecekan</h1>
                </div>
                <button onClick={handlePaymentConfirmed}>Konfirmasi Pembayaran</button>
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
};

export default PaymentConfirmation;
