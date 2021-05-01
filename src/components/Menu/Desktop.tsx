import React, { Component } from 'react';
import { View, StyleSheet, Platform, StyleProp, ViewStyle, Image, Pressable, Linking, Switch, TouchableOpacity, Text, FlatList, TextInput, ScrollView } from 'react-native';
import { themeSelect } from 'src/resources/theme';
import { ObjectInfo, SkinInfo, VehicleInfo } from 'src/types';
import { request } from 'src/utils/api';
import Row from '../Row';

interface Props {
    modelType: "vehicle" | "object" | "skin";
    onSelectItem: (model: any) => void;
}

interface States {
    list: any[],
    searchInputValue: string
}

export default class MenuDesktop extends Component<Props, States> {

    fullList: VehicleInfo[] | ObjectInfo[] | SkinInfo[] = [];

    constructor(props: Props) {
        super(props);

        this.state = {
            list: [],
            searchInputValue: ''
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
            onSelectItem
        } = this.props;

        const {
            list,
            searchInputValue
        } = this.state;

        return (
            <View
                style={{
                    width: '100%', height: '100%', direction: 'rtl',
                    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 3.00,
                    shadowOffset: { width: 1, height: 1, }
                }}
            >
                <Row
                    style={{
                        height: 70, width: '100%', backgroundColor: theme.textBox,
                        direction: 'ltr', borderBottomWidth: 0.5, borderColor: theme.lines,
                    }}
                    centerContainerStyle={{ flex: undefined }}
                    leftContainerStyle={{ height: '100%', flex: 1 }}
                    leftComponent={
                        <View style={{ width: '100%', paddingRight: 10 }}>
                            <TextInput
                                value={searchInputValue}
                                style={{
                                    height: 60, width: '100%', paddingHorizontal: 15
                                }}
                                placeholder={"Search for a model by name or id"}
                                placeholderTextColor={theme.textBoxPlaceholder}
                                onChangeText={(text) => {
                                    this.setState({ searchInputValue: text })
                                    if (text.length) {
                                        this.searchInModelList(text);
                                    }
                                    else {
                                        this.setState({ list: this.fullList })
                                    }
                                }}
                            />
                        </View>
                    }
                    rightContainerStyle={{ height: '100%', flex: undefined }}
                    rightComponent={
                        <TouchableOpacity
                            onPress={() => {
                                this.setState({ searchInputValue: '' });
                                this.setState({ list: this.fullList });
                            }}
                        >
                            <Text style={{ fontSize: 30, color: 'black' }}>×</Text>
                        </TouchableOpacity>
                    }
                />
                <ScrollView style={{ height: '100%' }} contentContainerStyle={{ flexGrow: 1, direction: 'ltr' }}>
                    {list.map((item, index) => {
                        return (
                            <TouchableOpacity
                                key={index}
                                style={{
                                    paddingHorizontal: 18
                                }}
                                onPress={() => {
                                    if (onSelectItem) {
                                        onSelectItem(item);
                                    }
                                }}
                            >
                                <View
                                    style={{
                                        height: '100%', width: '100%', alignItems: 'center',
                                        paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between'
                                    }}
                                >
                                    <Text style={{ color: '#aaa', fontSize: 18 }}>{item.name}</Text>
                                    <Text style={{ color: '#aaa', fontSize: 18 }}>{item.id}</Text>
                                </View>
                                <View
                                    style={{
                                        borderBottomWidth: 0.5, borderColor: '#999', marginHorizontal: 20
                                    }}
                                />
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            </View>
        );
    }
}
