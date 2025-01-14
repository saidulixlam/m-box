import React, { useState, useEffect } from 'react';
import { Button, Modal, Container, Form } from 'react-bootstrap';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { useDispatch, useSelector } from 'react-redux';
import { emailActions } from '../../store/emailSlice';
import useMailAPI from '../utils/useMail';

const ComposeEmail = (props) => {
    const dispatch = useDispatch();
    const [mailBody, setMailBody] = useState("");
    const sent = useMailAPI('sent');
    const { email, subject, body } = useSelector((state) => state.email);

    const senderEmail = localStorage.getItem('email');
    const endpoint = localStorage.getItem('endpoint');

    const handleEmailChange = (e) => {
        dispatch(emailActions.setEmail(e.target.value));
    };

    const handleSubjectChange = (e) => {
        dispatch(emailActions.setEmailSubject(e.target.value));
    };

    const handleEditorStateChange = (editorState) => {
        dispatch(emailActions.setEmailBody(editorState));
    };

    useEffect(() => {
        setMailBody(body.getCurrentContent().getPlainText());
    }, [body]);

    const url = 'https://shoppy-8c801-default-rtdb.firebaseio.com';

    const sendEmail = async () => {
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');

            return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
        };
        const formattedDate = formatDate(new Date());
        const sentEmailData = {
            to: email,
            subject: subject,
            body: mailBody,
            time: formattedDate,
            read: false,
            recieve: false,
            send: true,
            sender: senderEmail,
        };
    
        const receivedEmailData = {
            from: senderEmail,
            subject: subject,
            body: mailBody,
            time: formattedDate,
            read: false,
            recieve: true,
            send: false,
            sender: senderEmail,
        };
    
        try {
            // Send the email to the receiver's inbox
            const modifiedEmail = email.replace(/[^a-zA-Z0-9]/g, '');
            console.log(modifiedEmail);
            await fetch(`${url}/inbox/${modifiedEmail}.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(receivedEmailData),
            });
    
            // Send the email to the sender's sent folder
            const response = await fetch(`${url}/sent/${endpoint}.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sentEmailData),
            });
    
            if (response.ok) {
                sent.fetchDataAndUpdateStore('sent')
                dispatch(emailActions.resetEmailComposition());
            } else {
                alert('Failed to send email.');
            }
        } catch (error) {
            console.error('Error sending email:', error);
        }
        props.handleClose();
    
    };

    const deleteEmail = () => {
        const confirmDelete = window.confirm('Are you sure you want to delete this email?');
        if (confirmDelete) {
            console.log('Email deleted.');
        }
        props.handleClose();
    };

    return (
        <Modal show={props.show} onHide={props.handleClose} size="lg" className='mt-5 py-5'>
            <Modal.Header closeButton>
                <Modal.Title>Compose Email</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container>
                    <Form.Group>
                        <Form.Label>To Email</Form.Label>
                        <div className="rounded p-1">
                            <Form.Control
                                type='email'
                                value={email}
                                onChange={handleEmailChange}
                                placeholder='To Email'
                            />
                        </div>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Subject</Form.Label>
                        <Form.Control
                            type='text'
                            value={subject}
                            onChange={handleSubjectChange}
                            placeholder='Subject'
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Write your Email here</Form.Label>
                        <Editor
                            size='lg'
                            editorState={body}
                            onEditorStateChange={handleEditorStateChange}
                            placeholder='Write your Email here'
                        />
                    </Form.Group>
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={deleteEmail}>Delete</Button>
                <Button onClick={sendEmail} variant="primary">Send Email</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ComposeEmail;
