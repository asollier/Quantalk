import React, {useEffect, useState} from 'react';
import ChannelList from './ChannelList';
import {ChatChannel} from '../../../models/ChatChannel';
import {LoggedInUserData, useLoggedInUserData} from '../../../api/authentication/AuthenticationManager';
import ChannelAPI from '../../../api/channel/ChannelAPI';
import {WebSocketManager} from '../../../api/websocket/WebSocketManager';
import IconMessage from '../../utils/IconMessage';
import './ManagedChannelList.scss';
import {WebSocketIncomingMessage} from '../../../api/websocket/WebSocketIncomingMessage';

/**
 * Props for the ManagedChannelList component
 */
interface ManagedChannelListProps {
    /**
     * WebSocket connection to where get channel events from
     */
    websocket?: WebSocketManager,

    /**
     * ID of the selected chat channel
     */
    selectedChannelId?: number,

    /**
     * Callback called when a channel was clicked
     *
     * @param data Data about the channel that was clicked
     */
    onChannelClickListener?: (data: ChatChannel) => void,
}

/**
 * Manages a ChannelList with data provided from the server
 *
 * @param props Component props
 * @constructor
 */
const ManagedChannelList: React.FunctionComponent<ManagedChannelListProps> = (props: ManagedChannelListProps) => {
    // Component state
    const [channels, setChannels] = useState<Array<ChatChannel>>([]);
    const [fetchError, setFetchError] = useState<boolean>(false);

    // Get the logged in user data
    const loggedInUserData: LoggedInUserData | undefined = useLoggedInUserData();

    // Pass the channel that was clicked to the parent
    const onChannelClick = (idx: number, data: ChatChannel) => {
        props.onChannelClickListener?.(data);
    };

    useEffect(() => {
        // Fetch the available channels and put them in the state
        if (loggedInUserData !== undefined) {
            ChannelAPI.fetchChannels(loggedInUserData.jwt)
                .then((res) => {
                    if (!res.error) {
                        setChannels(res.channels);
                    }

                    setFetchError(res.error);
                });
        }
    }, [loggedInUserData]);

    useEffect(() => {
        if (props.websocket !== undefined) {
            // Listen for channel events on the websocket
            const onWebSocketMessage = (msg: WebSocketIncomingMessage) => {
                if (msg.type === 'channelCreated') {
                    // A channel has been created
                    setChannels((prev) => {
                        return [...prev, {
                            id: msg.id,
                            owner: msg.owner,
                            ownerUsername: msg.ownerUsername,
                            title: msg.title,
                        }];
                    });
                }
            };

            props.websocket.getOnMessageListenable().addListener(onWebSocketMessage);

            return () => {
                // Remove the listener when we're finished
                props.websocket?.getOnMessageListenable().removeListener(onWebSocketMessage);
            };
        }
    }, [props.websocket]);

    if (fetchError) {
        // Show an error message if an error occurred while fetching channels
        return (
            <div className={'managed-channel-list-error'}>
                <IconMessage iconName={'warning'} message={'Les salons n\'ont pas pu être récupérés'}/>
            </div>
        );
    }

    return (
        <ChannelList data={channels} selectedId={props.selectedChannelId}
                     onItemClickListener={onChannelClick}/>
    );
};

export default ManagedChannelList;
