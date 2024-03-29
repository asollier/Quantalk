import CommonPageLayout from '../../components/common_page/CommonPageLayout';
import React, {useEffect, useRef, useState} from 'react';
import ChannelAPI from '../../api/channel/ChannelAPI';
import LoggedInButton from '../../components/utils/LoggedInButton';
import {ChatChannel} from '../../models/ChatChannel';
import {useHistory, useParams} from 'react-router-dom';
import {LoggedInUserData, useLoggedInUserData} from '../../api/authentication/AuthenticationManager';
import AddChannelInput from '../../components/chat/channel/AddChannelInput';
import './ChatHome.scss';
import {WebSocketManager} from '../../api/websocket/WebSocketManager';
import ManagedChannelList from '../../components/chat/channel/ManagedChannelList';
import ManagedMessageList from '../../components/chat/message/ManagedMessageList';
import IconMessage from '../../components/utils/IconMessage';
import SendMessageInput from '../../components/chat/message/SendMessageInput';
import MessageAPI from '../../api/message/MessageAPI';

/**
 * Route parameters for this page
 */
export interface ChatHomeRouteParams {
    /**
     * ID of the chat channel to show
     */
    channelId?: string,
}

/**
 * The home page of the app
 * @constructor
 */
const ChatHome: React.FunctionComponent = () => {
    // Page state and ref
    const websocketManager = useRef<WebSocketManager | undefined>(undefined);
    const [websocketLoading, setWebsocketLoading] = useState<boolean>(true);

    const [channelCreationError, setChannelCreationError] = useState<boolean>(false);
    const [messageSendError, setMessageSendError] = useState<boolean>(false);

    // Get the logged in user data
    const loggedInUserToken: LoggedInUserData | undefined = useLoggedInUserData();

    // Get route params and history hook
    const params = useParams<ChatHomeRouteParams>();
    const history = useHistory();

    // Get the selected channel ID
    let selectedChannelId: number | undefined = undefined;

    if (params.channelId !== undefined) {
        selectedChannelId = parseInt(params.channelId);

        // We don't want NaN
        if (isNaN(selectedChannelId)) {
            selectedChannelId = undefined;
        }
    }

    // Add the channel when the user requires it
    const onChannelAddButtonClick = (channelName: string) => {
        if (loggedInUserToken !== undefined) {
            ChannelAPI.addChannel(loggedInUserToken.jwt, channelName)
                .then((res) => {
                    setChannelCreationError(res.error);
                });
        }
    };

    // Select the channel ID that was clicked
    const onChannelClick = (data: ChatChannel) => {
        history.push(`/channel/${data.id}`);
    };

    // Send the message to the server
    const onMessageSend = (message: string) => {
        if (loggedInUserToken !== undefined && selectedChannelId !== undefined) {
            MessageAPI.sendMessage(loggedInUserToken.jwt, selectedChannelId, message)
                .then((res) => {
                    setMessageSendError(res.error);
                });
        }
    };

    useEffect(() => {
        if (loggedInUserToken !== undefined && websocketManager.current === undefined) {
            // Instantiate a new WebSocketManager
            websocketManager.current = new WebSocketManager();

            // Send the auth token when the connection is open
            const onWebSocketOpenListener = () => {
                websocketManager.current?.send({
                    type: 'authentication',
                    token: loggedInUserToken.jwt,
                });

                // Subscribe to the selected channel if any
                if (selectedChannelId !== undefined) {
                    websocketManager.current?.send({
                        type: 'subscribe',
                        channelId: selectedChannelId,
                    });
                }

                websocketManager.current?.getOnOpenListenable().removeListener(onWebSocketOpenListener);
            };

            websocketManager.current?.getOnOpenListenable().addListener(onWebSocketOpenListener);
            setWebsocketLoading(false);
        }
    }, [loggedInUserToken, selectedChannelId]);

    useEffect(() => {
        // Subscribe to the channel that was switched
        if (selectedChannelId !== undefined && websocketManager.current?.getReadyState() === WebSocket.OPEN) {
            websocketManager.current?.send({
                type: 'subscribe',
                channelId: selectedChannelId,
            });
        }
    }, [selectedChannelId]);

    // Show a loading screen while we're connecting to the websocket
    if (websocketLoading) {
        return (
            <CommonPageLayout contentClassName={'chat-home-loading'} headerExtra={<LoggedInButton/>}>
                <IconMessage iconName={'autorenew'} message={'Connexion au serveur...'}/>
            </CommonPageLayout>
        );
    }

    return (
        <CommonPageLayout contentClassName={'chat-home'} headerExtra={<LoggedInButton/>}>
            <div className={'sidebar'}>
                <AddChannelInput onAddClick={onChannelAddButtonClick} error={channelCreationError}/>
                <ManagedChannelList websocket={websocketManager.current} onChannelClickListener={onChannelClick}
                                    selectedChannelId={selectedChannelId}/>
            </div>

            <div className={'messages'}>
                {selectedChannelId !== undefined ?
                    <>
                        <ManagedMessageList channelId={selectedChannelId} websocket={websocketManager.current}/>
                        <SendMessageInput onSend={onMessageSend} error={messageSendError}/>
                    </> :
                    <IconMessage iconName={'list'} message={'Sélectionnez un salon pour commencer'}/>}
            </div>
        </CommonPageLayout>
    );
};

export default ChatHome;
