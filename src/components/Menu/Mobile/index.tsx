import React, { Component } from 'react';
import { View, StyleSheet, Platform, StyleProp, ViewStyle, Image, Pressable, Linking, Switch, TouchableOpacity, Text, Modal as RNModal, TextInput } from 'react-native';
import Row from '../../Row';
import ModelList from './ModelList';
import { request } from 'src/utils/api';
import { ObjectInfo, SkinInfo, VehicleInfo } from 'src/types';
import { themeSelect } from 'src/resources/theme';

interface Props {
    modelType: "vehicle" | "object" | "skin";
    onSelectItem: (model: any) => void;
}

interface States {
    listVisible: boolean
    list: any[]
}

export default class MenuMobile extends Component<Props, States> {

    fullList: VehicleInfo[] | ObjectInfo[] | SkinInfo[] = [];

    constructor(props: Props) {
        super(props);

        this.state = {
            listVisible: false,
            list: []
        }
    }

    fetchModelList() {
        request<{ type: string }, { list: any[] }>('GET', 'api/list', {
            type: this.props.modelType
        })
            .then(response => {
                this.fullList = response.list;
                this.setState({ list: response.list });
            })
            .catch(error => {
                console.log(error);
            });
    }

    searchInModelList(query: string) {
        request<{ type: string, q: string }, { results: any[] }>('GET', 'api/search', {
            type: this.props.modelType,
            q: query
        })
            .then(response => {
                this.setState({ list: response.results });
            })
            .catch(error => {
                console.log(error);
            });
    }

    componentDidMount() {
        this.fetchModelList();
    }

    componentDidUpdate(prevProps: Props, prevState) {
        if (prevProps.modelType !== this.props.modelType) {
            this.fetchModelList();
        }
    }

    render() {

        const theme = themeSelect();

        const {
            listVisible,
            list
        } = this.state;

        const {
            onSelectItem
        } = this.props;

        return (
            <>
                <Row
                    style={{ height: '4rem', width: '100%', paddingHorizontal: 20, justifyContent: 'flex-start', backgroundColor: theme.mainBg }}
                    leftContainerStyle={{ height: '100%', flex: undefined, marginRight: '0.5rem' }}
                    leftComponent={
                        <TouchableOpacity
                            style={{
                                width: '3rem', height: '3rem', borderRadius: 100
                            }}
                            onPress={() => {
                                this.setState({ listVisible: !listVisible });
                            }}
                        >
                            <Image source={{ uri: '/img/menu.png' }} style={{ width: '100%', height: '100%', tintColor: '#999' }} />
                        </TouchableOpacity>
                    }
                    centerContainerStyle={{ height: '100%', flex: undefined, marginRight: '0.5rem' }}
                    centerComponent={
                        <View>
                            <TouchableOpacity
                                style={{
                                    borderWidth: 0.5,
                                    borderColor: theme.button,
                                    borderRadius: 100,
                                    paddingHorizontal: '1rem',
                                    paddingVertical: 5
                                }}
                            >
                                <Text style={{ color: theme.button }}>Background color</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    rightContainerStyle={{ height: '100%', flex: undefined }}
                    rightComponent={
                        <View>
                            <TouchableOpacity
                                style={{
                                    borderWidth: 0.5,
                                    borderColor: theme.button,
                                    borderRadius: 100,
                                    paddingHorizontal: '1rem',
                                    paddingVertical: 5
                                }}
                            >
                                <Text style={{ color: theme.button }}>Model info</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
                <ModelList
                    visible={listVisible}
                    onRequestClose={() => this.setState({ listVisible: !listVisible })}
                    data={list}
                    onSelect={(item) => {
                        onSelectItem(item);
                        this.setState({ listVisible: !listVisible });
                    }}
                    onSearch={(query) => this.searchInModelList(query)}
                    onSearchEnd={() => {
                        this.setState({ list: this.fullList })
                    }}
                />
            </>
        );
    }
}
